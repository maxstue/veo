import { getRequestHeaders } from '@tanstack/react-start/server';
import { env } from 'cloudflare:workers';
import { and, eq } from 'drizzle-orm';

import { createDatabase } from '#/shared/lib/db/client';
import { member } from '#/shared/lib/db/schema';

import { getAuth } from './server';

export async function requireUser() {
  const session = await getAuth().api.getSession({ headers: getRequestHeaders() });

  if (!session) {
    throw new Response('Authentication required', { status: 401 });
  }

  return session;
}

export async function requireTeamMembership(teamId: string) {
  const session = await requireUser();
  const database = createDatabase(env.DB);
  const membership = await database
    .select({ organizationId: member.organizationId, role: member.role })
    .from(member)
    .where(and(eq(member.organizationId, teamId), eq(member.userId, session.user.id)))
    .limit(1);

  if (!membership[0]) {
    throw new Response('Team membership required', { status: 403 });
  }

  return { session, teamId: membership[0].organizationId, role: membership[0].role };
}

export async function requireTeamOwner(teamId: string) {
  const access = await requireTeamMembership(teamId);
  if (access.role !== 'owner') {
    throw new Response('Team owner access required', { status: 403 });
  }
  return access;
}
