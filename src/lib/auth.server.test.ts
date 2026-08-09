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
    RESEND_API_KEY: ['test', 'api', 'key'].join('-'),
  },
  waitUntil: mocks.waitUntil,
}));
vi.mock('@better-auth/drizzle-adapter', () => ({ drizzleAdapter: mocks.drizzleAdapter }));
vi.mock('better-auth/minimal', () => ({ betterAuth: mocks.betterAuth }));
vi.mock('better-auth/tanstack-start', () => ({ tanstackStartCookies: mocks.tanstackStartCookies }));
vi.mock('#/db/client', () => ({ createDatabase: mocks.createDatabase }));
vi.mock('#/db/schema', () => ({}));
vi.mock('./email.server', () => ({ sendPasswordResetEmail: mocks.sendPasswordResetEmail }));
vi.mock('./observability/metrics', () => ({
  Metrics: {
    recordUserDeleted: mocks.recordUserDeleted,
    recordUserRegistered: mocks.recordUserRegistered,
    recordPasswordResetRequested: mocks.recordPasswordResetRequested,
  },
}));

import { getAuth } from './auth.server';

type AuthOptions = {
  databaseHooks: { user: { create: { after: () => Promise<void> } } };
  emailAndPassword: { sendResetPassword: (data: { url: string; user: { email: string } }) => Promise<void> };
  user: { deleteUser: { afterDelete: () => Promise<void> } };
};

const authOptions = (getAuth() as unknown as { options: AuthOptions }).options;

describe('auth user lifecycle metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
