import { env } from "cloudflare:workers";
import { and, asc, count, desc, eq, isNull, sql } from "drizzle-orm";

import { createDatabase } from "#/db/client";
import { bingoCard, bingoTerm, team, teamInvitation, teamMember, user } from "#/db/schema";

import { getAuth } from "./auth.server";
import { requireTeamMembership, requireUser } from "./auth-guards.server";
import { createToken, hashToken } from "./invitation-tokens";
import { Metrics } from "./observability/metrics";
import { buildTeamLeaderboard } from "./team-leaderboard";

const invitationLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export async function getViewer() {
  const { getRequestHeaders } = await import("@tanstack/react-start/server");
  const session = await getAuth().api.getSession({ headers: getRequestHeaders() });

  return session ? { id: session.user.id, name: session.user.name } : null;
}

export async function listTeams() {
  const session = await requireUser();
  const database = createDatabase(env.DB);

  return database
    .select({ id: team.id, name: team.name, joinedAt: teamMember.joinedAt })
    .from(teamMember)
    .innerJoin(team, eq(team.id, teamMember.teamId))
    .where(eq(teamMember.userId, session.user.id))
    .orderBy(asc(team.name));
}

export async function createTeam(data: { name: string }) {
  const session = await requireUser();
  const database = createDatabase(env.DB);
  const teamId = crypto.randomUUID();
  const now = new Date();

  await database.batch([
    database.insert(team).values({
      id: teamId,
      name: data.name,
      createdByUserId: session.user.id,
      createdAt: now,
      updatedAt: now,
    }),
    database.insert(teamMember).values({
      teamId,
      userId: session.user.id,
      joinedAt: now,
    }),
  ]);

  Metrics.recordTeamCreated();

  return { teamId };
}

export async function getTeam(data: { teamId: string }) {
  await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const now = new Date();

  const [teams, members, invitations, terms, activities] = await Promise.all([
    database
      .select({ id: team.id, name: team.name, createdAt: team.createdAt })
      .from(team)
      .where(eq(team.id, data.teamId))
      .limit(1),
    database
      .select({ id: user.id, name: user.name, email: user.email, joinedAt: teamMember.joinedAt })
      .from(teamMember)
      .innerJoin(user, eq(user.id, teamMember.userId))
      .where(eq(teamMember.teamId, data.teamId))
      .orderBy(asc(user.name)),
    database
      .select({
        id: teamInvitation.id,
        expiresAt: teamInvitation.expiresAt,
        redeemedAt: teamInvitation.redeemedAt,
        revokedAt: teamInvitation.revokedAt,
        createdAt: teamInvitation.createdAt,
      })
      .from(teamInvitation)
      .where(eq(teamInvitation.teamId, data.teamId))
      .orderBy(desc(teamInvitation.createdAt)),
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
  ]);

  if (!teams[0]) {
    throw new Response("Team not found", { status: 404 });
  }

  return {
    team: teams[0],
    members,
    leaderboard: buildTeamLeaderboard(
      members,
      activities.map((activity) => ({
        memberId: activity.userId,
        cardsStarted: activity.cardsStarted,
        completedCards: activity.completedCards,
      })),
    ),
    terms,
    invitations: invitations.map((invitation) => ({
      ...invitation,
      status: getInvitationStatus(invitation, now),
    })),
  };
}

function getInvitationStatus(
  invitation: { expiresAt: Date; redeemedAt: Date | null; revokedAt: Date | null },
  now: Date,
) {
  if (invitation.revokedAt) return "revoked" as const;
  if (invitation.redeemedAt) return "redeemed" as const;
  if (invitation.expiresAt <= now) return "expired" as const;
  return "active" as const;
}

export async function createInvitation(data: { teamId: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const token = createToken();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + invitationLifetimeMs);

  await database.insert(teamInvitation).values({
    id: crypto.randomUUID(),
    teamId: data.teamId,
    tokenHash: await hashToken(token),
    invitedByUserId: session.user.id,
    expiresAt,
    createdAt: now,
  });

  return { token, expiresAt };
}

export async function revokeInvitation(data: { teamId: string; invitationId: string }) {
  await requireTeamMembership(data.teamId);
  const result = await createDatabase(env.DB)
    .update(teamInvitation)
    .set({ revokedAt: new Date() })
    .where(
      and(
        eq(teamInvitation.id, data.invitationId),
        eq(teamInvitation.teamId, data.teamId),
        isNull(teamInvitation.redeemedAt),
        isNull(teamInvitation.revokedAt),
      ),
    );

  if (!result.meta.changes) {
    throw new Response("Invitation is no longer active", { status: 409 });
  }

  return { success: true };
}

export async function getInvitation(data: { token: string }) {
  const database = createDatabase(env.DB);
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

  if (!invitation) return { status: "invalid" as const };
  if (invitation.revokedAt) return { status: "revoked" as const, teamName: invitation.teamName };
  if (invitation.redeemedAt) return { status: "redeemed" as const, teamName: invitation.teamName };
  if (invitation.expiresAt <= new Date())
    return { status: "expired" as const, teamName: invitation.teamName };

  return {
    status: "valid" as const,
    teamName: invitation.teamName,
    expiresAt: invitation.expiresAt,
  };
}

export async function redeemInvitation(data: { token: string }) {
  const session = await requireUser();
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
      `INSERT OR IGNORE INTO team_member (team_id, user_id, joined_at)
         SELECT team_id, ?, ?
         FROM team_invitation
         WHERE token_hash = ?
           AND redeemed_at = ?
           AND redeemed_by_user_id = ?`,
    ).bind(session.user.id, now, tokenHash, now, session.user.id),
  ]);

  if (!results[0]?.meta.changes) {
    throw new Response("Invitation is not active", { status: 409 });
  }

  const invitation = await createDatabase(env.DB)
    .select({ teamId: teamInvitation.teamId })
    .from(teamInvitation)
    .where(eq(teamInvitation.tokenHash, tokenHash))
    .limit(1);

  return { teamId: invitation[0]!.teamId };
}
