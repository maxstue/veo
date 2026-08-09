import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth/minimal';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { env, waitUntil } from 'cloudflare:workers';

import { createDatabase } from '#/db/client';
import * as schema from '#/db/schema';

import { sendPasswordResetEmail } from './email.server';
import { Metrics } from './observability/metrics';

function createAuth(runtime: Cloudflare.Env) {
  if (!runtime.BETTER_AUTH_SECRET || runtime.BETTER_AUTH_SECRET.length < 32) {
    throw new Error('BETTER_AUTH_SECRET must be configured with at least 32 characters. See .env.example.');
  }

  return betterAuth({
    appName: 'Veo',
    baseURL: {
      allowedHosts: ['veo.justmax.xyz', 'veo.maxstue2304-aaa.workers.dev', 'localhost:5173'],
    },
    secret: runtime.BETTER_AUTH_SECRET,
    database: drizzleAdapter(createDatabase(runtime.DB), {
      provider: 'sqlite',
      schema,
    }),
    databaseHooks: {
      user: {
        create: {
          after: async () => Metrics.recordUserRegistered(),
        },
      },
    },
    emailAndPassword: {
      enabled: true,
      minPasswordLength: 8,
      requireEmailVerification: false,
      resetPasswordTokenExpiresIn: 60 * 60,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ url, user }) => {
        Metrics.recordPasswordResetRequested();

        const delivery = sendPasswordResetEmail(runtime.RESEND_API_KEY, {
          resetUrl: url,
          to: user.email,
        });

        waitUntil(delivery);
      },
    },
    user: {
      deleteUser: {
        afterDelete: async () => Metrics.recordUserDeleted(),
        enabled: true,
      },
    },
    trustedOrigins: ['https://veo.justmax.xyz', 'https://veo.maxstue2304-aaa.workers.dev', 'http://localhost:5173'],
    plugins: [tanstackStartCookies()],
  });
}

export type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

export function getAuth(): Auth {
  auth ??= createAuth(env);
  return auth;
}
