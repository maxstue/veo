import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  betterAuth: vi.fn((options: unknown) => ({ options })),
  createDatabase: vi.fn(() => ({ binding: 'database' })),
  drizzleAdapter: vi.fn(() => ({ adapter: 'drizzle' })),
  recordUserDeleted: vi.fn(),
  recordUserRegistered: vi.fn(),
  tanstackStartCookies: vi.fn(() => ({ id: 'tanstack-start-cookies' })),
}));

vi.mock('cloudflare:workers', () => ({
  env: {
    BETTER_AUTH_SECRET: 'x'.repeat(32),
    DB: { binding: 'test' },
  },
}));
vi.mock('@better-auth/drizzle-adapter', () => ({ drizzleAdapter: mocks.drizzleAdapter }));
vi.mock('better-auth/minimal', () => ({ betterAuth: mocks.betterAuth }));
vi.mock('better-auth/tanstack-start', () => ({ tanstackStartCookies: mocks.tanstackStartCookies }));
vi.mock('#/db/client', () => ({ createDatabase: mocks.createDatabase }));
vi.mock('#/db/schema', () => ({}));
vi.mock('./observability/metrics', () => ({
  Metrics: {
    recordUserDeleted: mocks.recordUserDeleted,
    recordUserRegistered: mocks.recordUserRegistered,
  },
}));

import { getAuth } from './auth.server';

describe('auth user lifecycle metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('records successful user creation and deletion through Better Auth hooks', async () => {
    getAuth();

    const options = mocks.betterAuth.mock.calls[0]![0] as {
      databaseHooks: { user: { create: { after: () => Promise<void> } } };
      user: { deleteUser: { afterDelete: () => Promise<void> } };
    };

    await options.databaseHooks.user.create.after();
    await options.user.deleteUser.afterDelete();

    expect(mocks.recordUserRegistered).toHaveBeenCalledOnce();
    expect(mocks.recordUserDeleted).toHaveBeenCalledOnce();
  });
});
