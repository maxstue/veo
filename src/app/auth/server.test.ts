import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: unknown) => ({ options })),
  createDatabase: vi.fn(() => ({ binding: 'database' })),
  drizzleAdapter: vi.fn(() => ({ adapter: 'drizzle' })),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  recordUserDeleted: vi.fn(),
  recordUserRegistered: vi.fn(),
  recordPasswordResetRequested: vi.fn(),
  tanstackStartCookies: vi.fn(() => ({ id: 'tanstack-start-cookies' })),
  waitUntil: vi.fn(),
}));

vi.mock('cloudflare:workers', () => ({
  env: {
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    DB: { binding: 'test' },
    GOOGLE_CLIENT_ID: 'google-client-id',
    GOOGLE_CLIENT_SECRET: 'google-client-secret',
    MICROSOFT_CLIENT_ID: 'microsoft-client-id',
    MICROSOFT_CLIENT_SECRET: 'microsoft-client-secret',
    RESEND_API_KEY: ['test', 'api', 'key'].join('-'),
  },
  waitUntil: mocks.waitUntil,
}));
vi.mock('@better-auth/drizzle-adapter', () => ({ drizzleAdapter: mocks.drizzleAdapter }));
vi.mock('better-auth/minimal', () => ({ betterAuth: mocks.betterAuth }));
vi.mock('better-auth/tanstack-start', () => ({ tanstackStartCookies: mocks.tanstackStartCookies }));
vi.mock('#/shared/lib/db/client', () => ({ createDatabase: mocks.createDatabase }));
vi.mock('#/shared/lib/db/schema/auth', () => ({}));
vi.mock('#/shared/lib/db/schema/veo', () => ({}));
vi.mock('./email.server', () => ({ sendPasswordResetEmail: mocks.sendPasswordResetEmail }));
vi.mock('#/shared/lib/observability/metrics', () => ({
  Metrics: {
    recordUserDeleted: mocks.recordUserDeleted,
    recordUserRegistered: mocks.recordUserRegistered,
    recordPasswordResetRequested: mocks.recordPasswordResetRequested,
  },
}));

import { getAuth } from './server';

type AuthOptions = {
  account: {
    encryptOAuthTokens: boolean;
    accountLinking: {
      enabled: boolean;
      disableImplicitLinking: boolean;
      allowDifferentEmails: boolean;
      allowUnlinkingAll: boolean;
    };
  };
  databaseHooks: { user: { create: { after: () => Promise<void> } } };
  emailAndPassword: { sendResetPassword: (data: { url: string; user: { email: string } }) => Promise<void> };
  session: { cookieCache: { enabled: boolean; maxAge: number } };
  socialProviders: {
    google: { clientId: string; clientSecret: string; prompt: string };
    microsoft: {
      authority: string;
      clientId: string;
      clientSecret: string;
      prompt: string;
      tenantId: string;
    };
  };
  user: { deleteUser: { afterDelete: () => Promise<void> } };
};

const authOptions = (getAuth() as unknown as { options: AuthOptions }).options;

describe('auth user lifecycle metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('caches session data briefly to avoid repeated D1 reads without extending the revocation window', () => {
    expect(authOptions.session.cookieCache).toEqual({ enabled: true, maxAge: 60 });
  });

  it('configures Google and Microsoft with explicit account selection and safe linking rules', () => {
    expect(authOptions.socialProviders).toEqual({
      google: {
        clientId: 'google-client-id',
        clientSecret: 'google-client-secret',
        prompt: 'select_account',
      },
      microsoft: {
        authority: 'https://login.microsoftonline.com',
        clientId: 'microsoft-client-id',
        clientSecret: 'microsoft-client-secret',
        prompt: 'select_account',
        tenantId: 'common',
      },
    });
    expect(authOptions.account).toEqual({
      encryptOAuthTokens: true,
      accountLinking: {
        enabled: true,
        disableImplicitLinking: true,
        allowDifferentEmails: false,
        allowUnlinkingAll: false,
      },
    });
  });

  it('records successful user creation and deletion through Better Auth hooks', async () => {
    await authOptions.databaseHooks.user.create.after();
    await authOptions.user.deleteUser.afterDelete();

    expect(mocks.recordUserRegistered).toHaveBeenCalledOnce();
    expect(mocks.recordUserDeleted).toHaveBeenCalledOnce();
  });

  it('schedules reset email delivery without exposing the token through application data', async () => {
    await authOptions.emailAndPassword.sendResetPassword({
      url: 'https://veo.example/reset-password?token=reset-token',
      user: { email: 'user@example.test' },
    });

    expect(mocks.sendPasswordResetEmail).toHaveBeenCalledWith(['test', 'api', 'key'].join('-'), {
      resetUrl: 'https://veo.example/reset-password?token=reset-token',
      to: 'user@example.test',
    });
    expect(mocks.waitUntil).toHaveBeenCalledWith(expect.any(Promise));
    expect(mocks.recordPasswordResetRequested).toHaveBeenCalledOnce();
  });
});
