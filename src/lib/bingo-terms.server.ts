import { env } from 'cloudflare:workers';
import { and, eq, ne } from 'drizzle-orm';

import { createDatabase } from '#/db/client';
import { bingoTerm } from '#/db/schema';

import { requireTeamMembership } from './auth-guards.server';
import { parseBingoTermLabel } from './bingo-term-label';

export async function createBingoTerm(data: { teamId: string; label: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const parsed = parseBingoTermLabel(data.label);
  const now = new Date();
  const term = {
    id: crypto.randomUUID(),
    teamId: data.teamId,
    ...parsed,
    createdByUserId: session.user.id,
    updatedByUserId: session.user.id,
    createdAt: now,
    updatedAt: now,
  };

  const result = await database.insert(bingoTerm).values(term).onConflictDoNothing();

  return result.meta.changes ? { status: 'created' as const, term } : { status: 'duplicate' as const };
}

export async function updateBingoTerm(data: { teamId: string; termId: string; label: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const parsed = parseBingoTermLabel(data.label);
  const existing = await database
    .select({ id: bingoTerm.id })
    .from(bingoTerm)
    .where(and(eq(bingoTerm.id, data.termId), eq(bingoTerm.teamId, data.teamId)))
    .limit(1);

  if (!existing[0]) return { status: 'not-found' as const };

  const duplicate = await database
    .select({ id: bingoTerm.id })
    .from(bingoTerm)
    .where(
      and(
        eq(bingoTerm.teamId, data.teamId),
        eq(bingoTerm.normalizedLabel, parsed.normalizedLabel),
        ne(bingoTerm.id, data.termId),
      ),
    )
    .limit(1);

  if (duplicate[0]) return { status: 'duplicate' as const };

  try {
    await database
      .update(bingoTerm)
      .set({ ...parsed, updatedByUserId: session.user.id, updatedAt: new Date() })
      .where(and(eq(bingoTerm.id, data.termId), eq(bingoTerm.teamId, data.teamId)));
  } catch (error) {
    const racedDuplicate = await database
      .select({ id: bingoTerm.id })
      .from(bingoTerm)
      .where(
        and(
          eq(bingoTerm.teamId, data.teamId),
          eq(bingoTerm.normalizedLabel, parsed.normalizedLabel),
          ne(bingoTerm.id, data.termId),
        ),
      )
      .limit(1);
    if (racedDuplicate[0]) return { status: 'duplicate' as const };
    throw error;
  }

  return { status: 'updated' as const };
}

export async function deleteBingoTerm(data: { teamId: string; termId: string }) {
  await requireTeamMembership(data.teamId);
  const result = await createDatabase(env.DB)
    .delete(bingoTerm)
    .where(and(eq(bingoTerm.id, data.termId), eq(bingoTerm.teamId, data.teamId)));

  return { status: result.meta.changes ? ('deleted' as const) : ('not-found' as const) };
}
