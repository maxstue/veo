import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';

const mocks = vi.hoisted(() => ({
  batch: vi.fn(),
  createDatabase: vi.fn(),
  getByName: vi.fn(),
  prepare: vi.fn(),
  requireTeamMembership: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock('cloudflare:workers', () => ({
  env: {
    DB: { batch: mocks.batch, prepare: mocks.prepare },
    GAME_SESSION: { getByName: mocks.getByName },
  },
}));
vi.mock('#/db/client', () => ({ createDatabase: mocks.createDatabase }));
vi.mock('./auth-guards.server', () => ({
  requireTeamMembership: mocks.requireTeamMembership,
  requireUser: mocks.requireUser,
}));

import {
  deleteGameSession,
  endGameSession,
  getGameSessionInvitation,
  redeemGameSessionInvitation,
} from './game-sessions.server';

const userSession = {
  session: { id: 'session-1' },
  user: { id: 'user-1', name: 'Ada' },
};

function selectDatabase(rows: unknown[]) {
  const query = {
    from: vi.fn(),
    innerJoin: vi.fn(),
    limit: vi.fn().mockResolvedValue(rows),
    where: vi.fn(),
  };
  query.from.mockReturnValue(query);
  query.innerJoin.mockReturnValue(query);
  query.where.mockReturnValue(query);

  return { select: vi.fn().mockReturnValue(query) };
}

function disposableResults<T>(values: T[]) {
  return Object.assign(values, { [Symbol.dispose]: vi.fn() });
}

async function expectHttpResponse(promise: Promise<unknown>, status: number, message: string) {
  const error: unknown = await promise.catch((reason: unknown) => reason);

  expect(error).toBeInstanceOf(Response);
  expect((error as Response).status).toBe(status);
  await expect((error as Response).text()).resolves.toBe(message);
}

describe('game-session invitation state', () => {
  beforeEach(() => vi.clearAllMocks());

  test.each([
    { expected: { status: 'invalid' }, row: undefined },
    {
      expected: { sessionId: 'game-1', status: 'created', teamId: 'team-1', teamName: 'Frontend Guild' },
      row: { id: 'game-1', status: 'created', teamId: 'team-1', teamName: 'Frontend Guild' },
    },
    { expected: { status: 'ended', teamName: 'Frontend Guild' }, row: { status: 'ended', teamName: 'Frontend Guild' } },
    {
      expected: { sessionId: 'game-1', status: 'active', teamId: 'team-1', teamName: 'Frontend Guild' },
      row: { id: 'game-1', status: 'active', teamId: 'team-1', teamName: 'Frontend Guild' },
    },
  ])('reports $expected.status session invitations', async ({ expected, row }) => {
    mocks.createDatabase.mockReturnValue(selectDatabase(row ? [row] : []));

    await expect(getGameSessionInvitation({ token: 'a'.repeat(43) })).resolves.toEqual(expected);
  });
});

describe('game-session invitation redemption', () => {
  beforeEach(() => vi.clearAllMocks());

  test('stops before D1 access when no authenticated session exists', async () => {
    mocks.requireUser.mockRejectedValue(new Response('Authentication required', { status: 401 }));

    await expectHttpResponse(redeemGameSessionInvitation({ token: 'a'.repeat(43) }), 401, 'Authentication required');
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.batch).not.toHaveBeenCalled();
  });

  test('rejects a link for a session that is no longer active', async () => {
    mocks.requireUser.mockResolvedValue(userSession);
    mocks.prepare.mockImplementation(() => ({ bind: vi.fn().mockReturnThis() }));
    mocks.batch.mockResolvedValue([{ meta: { changes: 0 } }, { meta: { changes: 0 } }]);

    await expectHttpResponse(
      redeemGameSessionInvitation({ token: 'a'.repeat(43) }),
      409,
      'Game session is no longer available',
    );
    expect(mocks.createDatabase).not.toHaveBeenCalled();
  });

  test('adds the authenticated user to the linked team and returns the available session', async () => {
    mocks.requireUser.mockResolvedValue(userSession);
    mocks.prepare.mockImplementation(() => ({ bind: vi.fn().mockReturnThis() }));
    mocks.batch.mockResolvedValue([{ meta: { changes: 1 } }, { meta: { changes: 1 } }]);
    mocks.createDatabase.mockReturnValue(selectDatabase([{ id: 'game-1', teamId: 'team-1' }]));

    await expect(redeemGameSessionInvitation({ token: 'a'.repeat(43) })).resolves.toEqual({
      sessionId: 'game-1',
      teamId: 'team-1',
    });
  });
});

describe('game-session finalization', () => {
  beforeEach(() => vi.clearAllMocks());

  test('seals the coordinator, persists one compact result per card, and then closes the session', async () => {
    const coordinator = {
      completeEnd: vi.fn().mockResolvedValue(undefined),
      finalize: vi.fn().mockResolvedValue(
        disposableResults([
          { userId: 'user-1', completedAt: 123 },
          { userId: 'user-2', completedAt: null },
        ]),
      ),
    };
    mocks.requireTeamMembership.mockResolvedValue({ session: { user: { id: 'user-1', name: 'Ada' } } });
    mocks.getByName.mockReturnValue(coordinator);
    mocks.createDatabase.mockReturnValue(selectDatabase([{ status: 'active' }]));
    mocks.prepare.mockImplementation((sql: string) => ({ bind: vi.fn().mockReturnValue({ sql }) }));
    mocks.batch.mockResolvedValue([{ meta: { changes: 1 } }, { meta: { changes: 1 } }, { meta: { changes: 1 } }]);

    await expect(endGameSession({ sessionId: 'game-1', teamId: 'team-1' })).resolves.toEqual({ status: 'ended' });

    expect(coordinator.finalize).toHaveBeenCalledOnce();
    expect(mocks.prepare).toHaveBeenCalledTimes(3);
    expect(mocks.batch).toHaveBeenCalledOnce();
    expect(coordinator.completeEnd).toHaveBeenCalledWith('Ada');
  });

  test('keeps the sealed durable state available when persisting final results fails', async () => {
    const coordinator = {
      completeEnd: vi.fn(),
      finalize: vi.fn().mockResolvedValue(disposableResults([{ userId: 'user-1', completedAt: null }])),
    };
    mocks.requireTeamMembership.mockResolvedValue({ session: { user: { id: 'user-1' } } });
    mocks.getByName.mockReturnValue(coordinator);
    mocks.createDatabase.mockReturnValue(selectDatabase([{ status: 'active' }]));
    mocks.prepare.mockImplementation((sql: string) => ({ bind: vi.fn().mockReturnValue({ sql }) }));
    mocks.batch.mockRejectedValue(new Error('D1 unavailable'));

    await expect(endGameSession({ sessionId: 'game-1', teamId: 'team-1' })).rejects.toThrow('D1 unavailable');
    expect(coordinator.completeEnd).not.toHaveBeenCalled();
  });

  test('retries coordinator cleanup without rewriting results for an already ended session', async () => {
    const coordinator = { completeEnd: vi.fn().mockResolvedValue(undefined), finalize: vi.fn() };
    mocks.requireTeamMembership.mockResolvedValue({ session: { user: { id: 'user-1', name: 'Ada' } } });
    mocks.getByName.mockReturnValue(coordinator);
    mocks.createDatabase.mockReturnValue(selectDatabase([{ status: 'ended' }]));

    await expect(endGameSession({ sessionId: 'game-1', teamId: 'team-1' })).resolves.toEqual({ status: 'ended' });

    expect(coordinator.finalize).not.toHaveBeenCalled();
    expect(mocks.batch).not.toHaveBeenCalled();
    expect(coordinator.completeEnd).toHaveBeenCalledWith('Ada');
  });
});

describe('game-session deletion', () => {
  beforeEach(() => vi.clearAllMocks());

  test('lets the coordinator delete a session when no other participant is connected', async () => {
    const removeIfUnoccupied = vi.fn().mockResolvedValue({ status: 'deleted' });
    mocks.requireTeamMembership.mockResolvedValue({ session: { user: { id: 'user-1' } } });
    mocks.getByName.mockReturnValue({ removeIfUnoccupied });
    mocks.createDatabase.mockReturnValue(selectDatabase([{ status: 'active' }]));

    await expect(deleteGameSession({ sessionId: 'game-1', teamId: 'team-1' })).resolves.toEqual({
      status: 'deleted',
    });

    expect(removeIfUnoccupied).toHaveBeenCalledWith('user-1');
  });

  test('rejects deletion while another participant is connected', async () => {
    const removeIfUnoccupied = vi.fn().mockResolvedValue({ status: 'occupied' });
    mocks.requireTeamMembership.mockResolvedValue({ session: { user: { id: 'user-1' } } });
    mocks.getByName.mockReturnValue({ removeIfUnoccupied });
    mocks.createDatabase.mockReturnValue(selectDatabase([{ status: 'active' }]));

    await expectHttpResponse(
      deleteGameSession({ sessionId: 'game-1', teamId: 'team-1' }),
      409,
      'Another participant is still connected',
    );
  });
});
