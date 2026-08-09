import { env } from 'cloudflare:workers';
import { eq } from 'drizzle-orm';

import { createDatabase } from '#/db/client';
import { account } from '#/db/schema';

import { requireUser } from './auth-guards.server';
import { getAuthMethods } from './auth-methods';

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
