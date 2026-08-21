import { env } from 'cloudflare:workers';
import { count, eq } from 'drizzle-orm';

import { createDatabase } from '#/shared/lib/db/client';
import { gameSession } from '#/shared/lib/db/schema/veo';

export async function getActiveGameCount() {
  const result = await createDatabase(env.DB)
    .select({ count: count() })
    .from(gameSession)
    .where(eq(gameSession.status, 'active'));

  return { count: result[0]?.count ?? 0 };
}
