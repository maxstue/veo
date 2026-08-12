import { env } from 'cloudflare:workers';
import { and, desc, eq, or } from 'drizzle-orm';

import { createDatabase } from '#/db/client';
import { gameSession, team, type GameSessionStatus } from '#/db/schema';

import { requireTeamMembership, requireUser } from './auth-guards.server';
import { createToken, hashToken } from './invitation-tokens';
import { Metrics } from './observability/metrics';

const SESSION_LIFETIME_MS = 24 * 60 * 60 * 1_000;

export async function listGameSessions(data: { teamId: string }) {
  const { session: viewerSession } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);

  const sessions = await database
    .select({
      id: gameSession.id,
      status: gameSession.status,
      createdAt: gameSession.createdAt,
      startedAt: gameSession.startedAt,
    })
    .from(gameSession)
    .where(
      and(eq(gameSession.teamId, data.teamId), or(eq(gameSession.status, 'created'), eq(gameSession.status, 'active'))),
    )
    .orderBy(desc(gameSession.createdAt));
  return Promise.all(
    sessions.map(async (session) => {
      const coordinator = env.GAME_SESSION.getByName(session.id);
      await Promise.allSettled([initializeSessionCleanup(data.teamId, session)]);
      const availability = await Promise.allSettled([coordinator.canRemove(viewerSession.user.id)]);
      return {
        ...session,
        canDelete: availability[0]?.status === 'fulfilled' && availability[0].value,
      };
    }),
  );
}

export async function getGameSession(data: { sessionId: string; teamId: string }) {
  const { session: viewerSession } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const sessions = await database
    .select({
      id: gameSession.id,
      status: gameSession.status,
      createdAt: gameSession.createdAt,
      startedAt: gameSession.startedAt,
      endedAt: gameSession.endedAt,
      teamName: team.name,
    })
    .from(gameSession)
    .innerJoin(team, eq(team.id, gameSession.teamId))
    .where(and(eq(gameSession.id, data.sessionId), eq(gameSession.teamId, data.teamId)))
    .limit(1);
  const session = sessions[0];

  if (!session) {
    throw new Response('Game session not found', { status: 404 });
  }

  if (session.status !== 'ended') {
    await Promise.allSettled([initializeSessionCleanup(data.teamId, { ...session, id: data.sessionId })]);
  }

  const coordinator = env.GAME_SESSION.getByName(data.sessionId);
  const storedCards = session.status === 'ended' ? null : await coordinator.readScores();
  const cards = storedCards
    ? storedCards.map((card) => ({
        ...card,
        completedAt: card.completedAt ? new Date(card.completedAt) : null,
      }))
    : [];
  storedCards?.[Symbol.dispose]();

  return {
    canDelete: session.status !== 'ended' && (await coordinator.canRemove(viewerSession.user.id)),
    session,
    cards,
    viewerUserId: viewerSession.user.id,
    viewerUserName: viewerSession.user.name,
  };
}

export async function createGameSession(data: { teamId: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const token = createToken();
  const now = new Date();
  const sessionId = crypto.randomUUID();

  await createDatabase(env.DB)
    .insert(gameSession)
    .values({
      id: sessionId,
      teamId: data.teamId,
      createdByUserId: session.user.id,
      inviteTokenHash: await hashToken(token),
      status: 'created',
      createdAt: now,
    });
  try {
    await env.GAME_SESSION.getByName(sessionId).initialize(
      sessionId,
      data.teamId,
      now.getTime() + SESSION_LIFETIME_MS,
      'created',
    );
  } catch (error) {
    await env.DB.prepare('DELETE FROM game_session WHERE id = ? AND team_id = ?').bind(sessionId, data.teamId).run();
    throw error;
  }
  Metrics.recordGameSessionCreated();

  return { sessionId, token };
}

export async function startGameSession(data: { sessionId: string; teamId: string }) {
  await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const now = new Date();
  const result = await database
    .update(gameSession)
    .set({ status: 'active', startedAt: now })
    .where(
      and(eq(gameSession.id, data.sessionId), eq(gameSession.teamId, data.teamId), eq(gameSession.status, 'created')),
    );

  if (result.meta.changes) {
    Metrics.recordGameSessionStarted();
    await env.GAME_SESSION.getByName(data.sessionId).start(now.getTime() + SESSION_LIFETIME_MS);
    return { status: 'active' as const };
  }

  const current = await readCurrentSessionStatus(database, data);
  if (current.status === 'active') {
    await env.GAME_SESSION.getByName(data.sessionId).start(now.getTime() + SESSION_LIFETIME_MS);
  }
  return current;
}

export async function deleteGameSession(data: { sessionId: string; teamId: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const current = await readCurrentSessionStatus(createDatabase(env.DB), data);
  if (current.status === 'ended') {
    throw new Response('Ended sessions cannot be deleted here', { status: 409 });
  }

  const result = await env.GAME_SESSION.getByName(data.sessionId).removeIfUnoccupied(session.user.id);
  if (result.status === 'occupied') {
    throw new Response('Another participant is still connected', { status: 409 });
  }
  if (result.status === 'unavailable') {
    throw new Response('Game session is no longer available', { status: 409 });
  }
  Metrics.recordGameSessionDeleted();
  return { status: result.status };
}

export async function endGameSession(data: { sessionId: string; teamId: string }) {
  const { session: viewerSession } = await requireTeamMembership(data.teamId);
  const coordinator = env.GAME_SESSION.getByName(data.sessionId);
  const current = await readCurrentSessionStatus(createDatabase(env.DB), data);
  if (current.status === 'ended') {
    await coordinator.completeEnd(viewerSession.user.name);
    return current;
  }

  const results = await coordinator.finalize();
  const statements = results.map((result) =>
    env.DB.prepare(
      `INSERT INTO game_session_result (session_id, user_id, completed_at)
       VALUES (?, ?, ?)
       ON CONFLICT (session_id, user_id) DO UPDATE SET completed_at = excluded.completed_at`,
    ).bind(data.sessionId, result.userId, result.completedAt),
  );
  statements.push(
    env.DB.prepare(
      `UPDATE game_session
       SET status = 'ended', ended_at = ?
       WHERE id = ? AND team_id = ? AND status IN ('created', 'active')`,
    ).bind(Date.now(), data.sessionId, data.teamId),
  );
  results[Symbol.dispose]();
  const persisted = await env.DB.batch(statements);
  const updated = persisted.at(-1)?.meta.changes ?? 0;
  await coordinator.completeEnd(viewerSession.user.name);
  if (updated) {
    Metrics.recordGameSessionEnded();
  }
  return { status: 'ended' as const };
}

/** Replaces the active share token without ever persisting its plaintext form. */
export async function rotateGameSessionInvitation(data: { sessionId: string; teamId: string }) {
  await requireTeamMembership(data.teamId);
  const token = createToken();
  const result = await createDatabase(env.DB)
    .update(gameSession)
    .set({ inviteTokenHash: await hashToken(token) })
    .where(
      and(
        eq(gameSession.id, data.sessionId),
        eq(gameSession.teamId, data.teamId),
        or(eq(gameSession.status, 'created'), eq(gameSession.status, 'active')),
      ),
    );

  if (!result.meta.changes) {
    throw new Response('Game session is no longer available', { status: 409 });
  }

  return { token };
}

export async function getGameSessionInvitation(data: { token: string }) {
  const sessions = await createDatabase(env.DB)
    .select({
      id: gameSession.id,
      status: gameSession.status,
      teamId: team.id,
      teamName: team.name,
    })
    .from(gameSession)
    .innerJoin(team, eq(team.id, gameSession.teamId))
    .where(eq(gameSession.inviteTokenHash, await hashToken(data.token)))
    .limit(1);
  const session = sessions[0];

  if (!session) {
    return { status: 'invalid' as const };
  }
  if (session.status === 'ended') {
    return { status: 'ended' as const, teamName: session.teamName };
  }
  return {
    status: session.status,
    teamId: session.teamId,
    teamName: session.teamName,
    sessionId: session.id,
  } as const;
}

export async function redeemGameSessionInvitation(data: { token: string }) {
  const session = await requireUser();
  const tokenHash = await hashToken(data.token);
  const now = Date.now();
  const results = await env.DB.batch([
    env.DB.prepare(
      `UPDATE game_session
         SET started_at = started_at
         WHERE invite_token_hash = ? AND status IN ('created', 'active')`,
    ).bind(tokenHash),
    env.DB.prepare(
      `INSERT OR IGNORE INTO team_member (team_id, user_id, joined_at)
         SELECT team_id, ?, ?
         FROM game_session
         WHERE invite_token_hash = ? AND status IN ('created', 'active')`,
    ).bind(session.user.id, now, tokenHash),
  ]);

  if (!results[0]?.meta.changes) {
    throw new Response('Game session is no longer available', { status: 409 });
  }

  const joined = results[1]?.meta.changes ?? 0;
  if (joined) {
    Metrics.recordGameSessionJoined();
  }

  const sessions = await createDatabase(env.DB)
    .select({ id: gameSession.id, teamId: gameSession.teamId })
    .from(gameSession)
    .where(
      and(
        eq(gameSession.inviteTokenHash, tokenHash),
        or(eq(gameSession.status, 'created'), eq(gameSession.status, 'active')),
      ),
    )
    .limit(1);
  const game = sessions[0];
  if (!game) {
    throw new Response('Game session is no longer available', { status: 409 });
  }

  return { sessionId: game.id, teamId: game.teamId };
}

async function readCurrentSessionStatus(
  database: ReturnType<typeof createDatabase>,
  data: { sessionId: string; teamId: string },
) {
  const sessions = await database
    .select({ status: gameSession.status })
    .from(gameSession)
    .where(and(eq(gameSession.id, data.sessionId), eq(gameSession.teamId, data.teamId)))
    .limit(1);
  const status = sessions[0]?.status;

  if (!status) {
    throw new Response('Game session not found', { status: 404 });
  }
  return { status } as { status: GameSessionStatus };
}

async function initializeSessionCleanup(
  teamId: string,
  session: { createdAt: Date; id: string; startedAt: Date | null; status: GameSessionStatus },
) {
  const lifetimeStartedAt = session.status === 'active' ? (session.startedAt ?? session.createdAt) : session.createdAt;
  const expiresAt = Math.max(Date.now() + 1_000, lifetimeStartedAt.getTime() + SESSION_LIFETIME_MS);
  await env.GAME_SESSION.getByName(session.id).initialize(
    session.id,
    teamId,
    expiresAt,
    session.status === 'active' ? 'active' : 'created',
  );
}
