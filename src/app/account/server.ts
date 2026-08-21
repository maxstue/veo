import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';

import { requireUser } from '#/app/auth/guards.server';
import { getAuthMethods } from '#/app/auth/methods';
import { createDatabase } from '#/shared/lib/db/client';
import { account } from '#/shared/lib/db/schema/auth';

export async function getAccount() {
  const session = await requireUser();
  const accounts = await createDatabase(env.DB)
    .select({ providerId: account.providerId })
    .from(account)
    .where(eq(account.userId, session.user.id));

  return {
    user: {
      name: session.user.name,
      email: session.user.email,
      createdAt: session.user.createdAt,
    },
    authMethods: getAuthMethods(accounts.map((item) => item.providerId)),
  };
}
