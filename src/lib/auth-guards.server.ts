import { env } from "cloudflare:workers";
import { getRequestHeaders } from "@tanstack/react-start/server";
import { and, eq } from "drizzle-orm";

import { createDatabase } from "#/db/client";
import { teamMember } from "#/db/schema";

import { getAuth } from "./auth.server";

export async function requireUser() {
  const session = await getAuth().api.getSession({ headers: getRequestHeaders() });

  if (!session) {
    throw new Response("Authentication required", { status: 401 });
  }

  return session;
}

export async function requireTeamMembership(teamId: string) {
  const session = await requireUser();
  const database = createDatabase(env.DB);
  const membership = await database
    .select({ teamId: teamMember.teamId })
    .from(teamMember)
    .where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, session.user.id)))
    .limit(1);

  if (!membership[0]) {
    throw new Response("Team membership required", { status: 403 });
  }

  return { session, teamId: membership[0].teamId };
}
