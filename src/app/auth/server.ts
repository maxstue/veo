import { drizzleAdapter } from '@better-auth/drizzle-adapter';
import { betterAuth } from 'better-auth/minimal';
import { organization } from 'better-auth/plugins';
import { tanstackStartCookies } from 'better-auth/tanstack-start';
import { env, waitUntil } from 'cloudflare:workers';

import { createDatabase } from '#/shared/lib/db/client';
import * as schema from '#/shared/lib/db/schema';
import { Metrics } from '#/shared/lib/observability/metrics';

import { sendOrganizationInvitationEmail, sendPasswordResetEmail } from './email.server';
import { organizationAccess, organizationRoles } from './organization';

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
    plugins: [
      organization({
        ac: organizationAccess,
        roles: organizationRoles,
        creatorRole: 'owner',
        allowUserToCreateOrganization: false,
        disableOrganizationDeletion: true,
        teams: { enabled: false },
        invitationExpiresIn: 7 * 24 * 60 * 60,
        requireEmailVerificationOnInvitation: false,
        organizationHooks: {
          beforeAddMember: async ({ member: addedMember }) => ({
            data: { ...addedMember, role: normalizeOrganizationRole(addedMember.role) },
          }),
          beforeCreateInvitation: async ({ invitation: createdInvitation }) => ({
            data: { ...createdInvitation, role: 'member' },
          }),
          beforeUpdateMemberRole: async ({ newRole }) => ({ data: { role: normalizeOrganizationRole(newRole) } }),
        },
        sendInvitationEmail: async ({ id, email, organization: invitedOrganization, inviter }, request) => {
          const origin = request ? new URL(request.url).origin : 'https://veo.justmax.xyz';
          const invitationUrl = new URL(`/invite/${id}`, origin).toString();
          const delivery = sendOrganizationInvitationEmail(runtime.RESEND_API_KEY, {
            invitationUrl,
            inviterName: inviter.user.name,
            organizationName: invitedOrganization.name,
            to: email,
          });

          waitUntil(delivery);
        },
      }),
      tanstackStartCookies(),
    ],
  });
}

function normalizeOrganizationRole(role: string) {
  return role === 'owner' ? 'owner' : 'member';
}

export type Auth = ReturnType<typeof createAuth>;

let auth: Auth | undefined;

export function getAuth() {
  auth ??= createAuth(env);
  return auth;
}
