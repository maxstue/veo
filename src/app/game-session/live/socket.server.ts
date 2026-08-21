import { env } from 'cloudflare:workers';
import { and, eq, or } from 'drizzle-orm';

import { getAuth } from '#/app/auth/server';
import { createDatabase } from '#/shared/lib/db/client';
import { member } from '#/shared/lib/db/schema/auth';
import { gameSession } from '#/shared/lib/db/schema/veo';

const socketPath = /^\/api\/sessions\/([^/]+)\/socket$/;

export function isGameSessionSocketRequest(request: Request) {
  return socketPath.test(new URL(request.url).pathname);
}

export async function proxyGameSessionSocket(request: Request) {
  const sessionId = socketPath.exec(new URL(request.url).pathname)?.[1];
  if (!sessionId || request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
    return new Response('WebSocket upgrade required', { status: 426 });
  }

  const session = await getAuth().api.getSession({ headers: request.headers });
  if (!session) {
    return new Response('Authentication required', { status: 401 });
  }

  const sessions = await createDatabase(env.DB)
    .select({ id: gameSession.id })
    .from(gameSession)
    .innerJoin(member, eq(member.organizationId, gameSession.teamId))
    .where(
      and(
        eq(gameSession.id, sessionId),
        or(eq(gameSession.status, 'created'), eq(gameSession.status, 'active')),
        eq(member.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!sessions[0]) {
    return new Response('Available game-session membership required', { status: 403 });
  }

  const headers = new Headers(request.headers);
  headers.set('X-Veo-User-Id', session.user.id);
  headers.set('X-Veo-User-Name', encodeURIComponent(session.user.name));
  return env.GAME_SESSION.getByName(sessionId).fetch(new Request(request, { headers }));
}
