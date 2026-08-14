import { env } from 'cloudflare:workers';
import { and, asc, count, desc, eq, sql } from 'drizzle-orm';

import { requireTeamMembership, requireTeamOwner, requireUser } from '#/app/auth/guards.server';
import { getAuth } from '#/app/auth/server';
import { createDatabase } from '#/shared/lib/db/client';
import {
  bingoCard,
  bingoTerm,
  gameSession,
  gameSessionResult,
  invitation as organizationInvitation,
  member,
  organization,
  team,
  teamBingoRulesPreset,
  teamInvitation,
  user,
} from '#/shared/lib/db/schema';
import { Metrics } from '#/shared/lib/observability/metrics';

import { hashToken } from './invitations/tokens';
import { buildTeamLeaderboard } from './leaderboard/utils';

export async function getViewer() {
  const { getRequestHeaders } = await import('@tanstack/react-start/server');
  const session = await getAuth().api.getSession({ headers: getRequestHeaders() });

  return session ? { id: session.user.id, name: session.user.name } : null;
}

export async function listTeams() {
  const session = await requireUser();
  const database = createDatabase(env.DB);

  return database
    .select({ id: team.id, name: team.name, joinedAt: member.createdAt })
    .from(member)
    .innerJoin(team, eq(team.id, member.organizationId))
    .where(eq(member.userId, session.user.id))
    .orderBy(asc(team.name));
}

export async function createTeam(data: { name: string }) {
  const session = await requireUser();
  const database = createDatabase(env.DB);
  const teamId = crypto.randomUUID();
  const membershipId = crypto.randomUUID();
  const now = new Date();
  const slug = `${slugify(data.name)}-${teamId.slice(0, 8)}`;

  await database.batch([
    database.insert(organization).values({ id: teamId, name: data.name, slug, createdAt: now }),
    database.insert(team).values({
      id: teamId,
      name: data.name,
      createdByUserId: session.user.id,
      createdAt: now,
      updatedAt: now,
    }),
    database.insert(member).values({
      id: membershipId,
      organizationId: teamId,
      userId: session.user.id,
      role: 'owner',
      createdAt: now,
    }),
  ]);

  Metrics.recordTeamCreated();

  return { teamId };
}

export async function getTeam(data: { teamId: string }) {
  const access = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const now = new Date();

  const [teams, members, invitations, terms, cardActivities, sessionActivities, bingoRulesPresets] = await Promise.all([
    database
      .select({
        id: team.id,
        name: team.name,
        createdAt: team.createdAt,
        bingoBoardSize: team.bingoBoardSize,
        bingoWinHorizontal: team.bingoWinHorizontal,
        bingoWinVertical: team.bingoWinVertical,
        bingoWinDiagonal: team.bingoWinDiagonal,
        defaultBingoRulesPresetId: team.defaultBingoRulesPresetId,
      })
      .from(team)
      .where(eq(team.id, data.teamId))
      .limit(1),
    database
      .select({
        id: user.id,
        membershipId: member.id,
        name: user.name,
        email: user.email,
        joinedAt: member.createdAt,
        role: member.role,
      })
      .from(member)
      .innerJoin(user, eq(user.id, member.userId))
      .where(eq(member.organizationId, data.teamId))
      .orderBy(asc(user.name)),
    access.role === 'owner'
      ? database
          .select({
            id: organizationInvitation.id,
            email: organizationInvitation.email,
            expiresAt: organizationInvitation.expiresAt,
            status: organizationInvitation.status,
            createdAt: organizationInvitation.createdAt,
          })
          .from(organizationInvitation)
          .where(eq(organizationInvitation.organizationId, data.teamId))
          .orderBy(desc(organizationInvitation.createdAt))
      : Promise.resolve([]),
    database
      .select({ id: bingoTerm.id, label: bingoTerm.label, updatedAt: bingoTerm.updatedAt })
      .from(bingoTerm)
      .where(eq(bingoTerm.teamId, data.teamId))
      .orderBy(asc(bingoTerm.normalizedLabel)),
    database
      .select({
        userId: bingoCard.userId,
        cardsStarted: count(bingoCard.id),
        completedCards: sql<number>`count(case when ${bingoCard.completedAt} is not null then 1 end)`,
      })
      .from(bingoCard)
      .where(eq(bingoCard.teamId, data.teamId))
      .groupBy(bingoCard.userId),
    database
      .select({
        userId: gameSessionResult.userId,
        cardsStarted: count(),
        completedCards: sql<number>`count(case when ${gameSessionResult.completedAt} is not null then 1 end)`,
      })
      .from(gameSessionResult)
      .innerJoin(gameSession, eq(gameSession.id, gameSessionResult.sessionId))
      .where(eq(gameSession.teamId, data.teamId))
      .groupBy(gameSessionResult.userId),
    database
      .select({
        id: teamBingoRulesPreset.id,
        name: teamBingoRulesPreset.name,
        boardSize: teamBingoRulesPreset.boardSize,
        horizontal: teamBingoRulesPreset.winHorizontal,
        vertical: teamBingoRulesPreset.winVertical,
        diagonal: teamBingoRulesPreset.winDiagonal,
      })
      .from(teamBingoRulesPreset)
      .where(eq(teamBingoRulesPreset.teamId, data.teamId))
      .orderBy(asc(teamBingoRulesPreset.name)),
  ]);

  if (!teams[0]) {
    throw new Response('Team not found', { status: 404 });
  }

  return {
    team: {
      id: teams[0].id,
      name: teams[0].name,
      createdAt: teams[0].createdAt,
      bingoRules: {
        boardSize: teams[0].bingoBoardSize,
        horizontal: teams[0].bingoWinHorizontal,
        vertical: teams[0].bingoWinVertical,
        diagonal: teams[0].bingoWinDiagonal,
      },
      defaultBingoRulesPresetId: teams[0].defaultBingoRulesPresetId,
      viewerRole: access.role,
    },
    members,
    leaderboard: buildTeamLeaderboard(members, mergeBingoActivities(cardActivities, sessionActivities)),
    terms,
    bingoRulesPresets,
    invitations: invitations.map((teamInvite) => ({
      ...teamInvite,
      status: getOrganizationInvitationStatus(teamInvite, now),
    })),
  };
}

function mergeBingoActivities(
  ...activitySets: Array<Array<{ cardsStarted: number; completedCards: number; userId: string }>>
) {
  const totals = new Map<string, { cardsStarted: number; completedCards: number }>();
  for (const activities of activitySets) {
    for (const activity of activities) {
      const current = totals.get(activity.userId) ?? { cardsStarted: 0, completedCards: 0 };
      totals.set(activity.userId, {
        cardsStarted: current.cardsStarted + activity.cardsStarted,
        completedCards: current.completedCards + activity.completedCards,
      });
    }
  }
  return [...totals].map(([memberId, activity]) => ({ memberId, ...activity }));
}

export async function saveTeamBingoRulesPreset(data: {
  teamId: string;
  name: string;
  boardSize: number;
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
}) {
  await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);

  await database
    .insert(teamBingoRulesPreset)
    .values({
      id: crypto.randomUUID(),
      teamId: data.teamId,
      name: data.name,
      boardSize: data.boardSize,
      winHorizontal: data.horizontal,
      winVertical: data.vertical,
      winDiagonal: data.diagonal,
    })
    .onConflictDoUpdate({
      target: [teamBingoRulesPreset.teamId, teamBingoRulesPreset.name],
      set: {
        boardSize: data.boardSize,
        winHorizontal: data.horizontal,
        winVertical: data.vertical,
        winDiagonal: data.diagonal,
        updatedAt: new Date(),
      },
    });

  return { status: 'saved' as const };
}

export async function setTeamDefaultBingoRulesPreset(data: { teamId: string; presetId: string }) {
  await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const presets = await database
    .select({ id: teamBingoRulesPreset.id })
    .from(teamBingoRulesPreset)
    .where(and(eq(teamBingoRulesPreset.id, data.presetId), eq(teamBingoRulesPreset.teamId, data.teamId)))
    .limit(1);

  if (!presets[0]) {
    return { status: 'not-found' as const };
  }

  await database.update(team).set({ defaultBingoRulesPresetId: data.presetId }).where(eq(team.id, data.teamId));

  return { status: 'updated' as const };
}

function getOrganizationInvitationStatus(teamInvite: { expiresAt: Date; status: string }, now: Date) {
  if (teamInvite.status === 'accepted') {
    return 'redeemed' as const;
  }
  if (teamInvite.status === 'canceled' || teamInvite.status === 'rejected') {
    return 'revoked' as const;
  }
  if (teamInvite.expiresAt <= now) {
    return 'expired' as const;
  }
  return 'active' as const;
}

export async function createInvitation(data: { teamId: string; email: string }) {
  await requireTeamOwner(data.teamId);
  const existingMembers = await createDatabase(env.DB)
    .select({ id: member.id })
    .from(member)
    .innerJoin(user, eq(user.id, member.userId))
    .where(and(eq(member.organizationId, data.teamId), sql`lower(${user.email}) = ${data.email.toLowerCase()}`))
    .limit(1);
  if (existingMembers[0]) {
    return { status: 'already-member' as const };
  }

  const { getRequestHeaders } = await import('@tanstack/react-start/server');
  const created = await getAuth().api.createInvitation({
    body: { email: data.email, organizationId: data.teamId, resend: true, role: 'member' },
    headers: getRequestHeaders(),
  });
  return { status: 'sent' as const, invitationId: created.id, expiresAt: created.expiresAt };
}

export async function revokeInvitation(data: { teamId: string; invitationId: string }) {
  await requireTeamOwner(data.teamId);
  const database = createDatabase(env.DB);
  const pending = await database
    .select({ id: organizationInvitation.id })
    .from(organizationInvitation)
    .where(
      and(eq(organizationInvitation.id, data.invitationId), eq(organizationInvitation.organizationId, data.teamId)),
    )
    .limit(1);
  if (!pending[0]) {
    throw new Response('Invitation not found', { status: 404 });
  }
  const { getRequestHeaders } = await import('@tanstack/react-start/server');
  await getAuth().api.cancelInvitation({ body: { invitationId: data.invitationId }, headers: getRequestHeaders() });
  return { success: true };
}

export async function updateTeamMemberRole(data: { teamId: string; membershipId: string; role: 'owner' | 'member' }) {
  await requireTeamOwner(data.teamId);
  const { getRequestHeaders } = await import('@tanstack/react-start/server');
  await getAuth().api.updateMemberRole({
    body: { memberId: data.membershipId, organizationId: data.teamId, role: data.role },
    headers: getRequestHeaders(),
  });
  return { success: true };
}

export async function removeTeamMember(data: { teamId: string; membershipId: string }) {
  await requireTeamOwner(data.teamId);
  const { getRequestHeaders } = await import('@tanstack/react-start/server');
  await getAuth().api.removeMember({
    body: { memberIdOrEmail: data.membershipId, organizationId: data.teamId },
    headers: getRequestHeaders(),
  });
  return { success: true };
}

export async function getInvitation(data: { token: string }) {
  const database = createDatabase(env.DB);
  if (!isLegacyInvitationToken(data.token)) {
    const organizationInvitations = await database
      .select({
        teamName: organization.name,
        expiresAt: organizationInvitation.expiresAt,
        status: organizationInvitation.status,
      })
      .from(organizationInvitation)
      .innerJoin(organization, eq(organization.id, organizationInvitation.organizationId))
      .where(eq(organizationInvitation.id, data.token))
      .limit(1);
    const orgInvite = organizationInvitations[0];
    if (orgInvite) {
      const status = getOrganizationInvitationStatus(orgInvite, new Date());
      return status === 'active'
        ? { status: 'valid' as const, teamName: orgInvite.teamName, expiresAt: orgInvite.expiresAt }
        : { status, teamName: orgInvite.teamName };
    }
  }
  const invitations = await database
    .select({
      teamName: team.name,
      expiresAt: teamInvitation.expiresAt,
      redeemedAt: teamInvitation.redeemedAt,
      revokedAt: teamInvitation.revokedAt,
    })
    .from(teamInvitation)
    .innerJoin(team, eq(team.id, teamInvitation.teamId))
    .where(eq(teamInvitation.tokenHash, await hashToken(data.token)))
    .limit(1);
  const invitation = invitations[0];

  if (!invitation) {
    return { status: 'invalid' as const };
  }
  if (invitation.revokedAt) {
    return { status: 'revoked' as const, teamName: invitation.teamName };
  }
  if (invitation.redeemedAt) {
    return { status: 'redeemed' as const, teamName: invitation.teamName };
  }
  if (invitation.expiresAt <= new Date()) {
    return { status: 'expired' as const, teamName: invitation.teamName };
  }

  return {
    status: 'valid' as const,
    teamName: invitation.teamName,
    expiresAt: invitation.expiresAt,
  };
}

export async function redeemInvitation(data: { token: string }) {
  const session = await requireUser();
  if (!isLegacyInvitationToken(data.token)) {
    const organizationInvitations = await createDatabase(env.DB)
      .select({ organizationId: organizationInvitation.organizationId })
      .from(organizationInvitation)
      .where(eq(organizationInvitation.id, data.token))
      .limit(1);
    if (organizationInvitations[0]) {
      const { getRequestHeaders } = await import('@tanstack/react-start/server');
      await getAuth().api.acceptInvitation({ body: { invitationId: data.token }, headers: getRequestHeaders() });
      return { teamId: organizationInvitations[0].organizationId };
    }
  }
  const tokenHash = await hashToken(data.token);
  const now = Date.now();

  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE team_invitation
         SET redeemed_at = ?, redeemed_by_user_id = ?
         WHERE token_hash = ?
           AND redeemed_at IS NULL
           AND revoked_at IS NULL
           AND expires_at > ?`,
    ).bind(now, session.user.id, tokenHash, now),
    env.DB.prepare(
      `INSERT OR IGNORE INTO member (id, organization_id, user_id, role, created_at)
         SELECT ?, team_id, ?, 'member', ?
         FROM team_invitation
         WHERE token_hash = ?
           AND redeemed_at = ?
           AND redeemed_by_user_id = ?`,
    ).bind(crypto.randomUUID(), session.user.id, now, tokenHash, now, session.user.id),
  ]);

  if (!results[0]?.meta.changes) {
    throw new Response('Invitation is not active', { status: 409 });
  }

  const invitation = await createDatabase(env.DB)
    .select({ teamId: teamInvitation.teamId })
    .from(teamInvitation)
    .where(eq(teamInvitation.tokenHash, tokenHash))
    .limit(1);

  return { teamId: invitation[0]!.teamId };
}

function isLegacyInvitationToken(token: string) {
  return token.length === 43;
}

function slugify(value: string) {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return slug || 'team';
}
