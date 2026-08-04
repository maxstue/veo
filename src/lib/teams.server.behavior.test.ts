import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({
  batch: vi.fn(),
  createDatabase: vi.fn(),
  getRequestHeaders: vi.fn(),
  getSession: vi.fn(),
  prepare: vi.fn(),
  requireTeamMembership: vi.fn(),
  requireUser: vi.fn(),
}));

vi.mock("cloudflare:workers", () => ({
  env: { DB: { batch: mocks.batch, prepare: mocks.prepare } },
}));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeaders: mocks.getRequestHeaders,
}));
vi.mock("#/db/client", () => ({ createDatabase: mocks.createDatabase }));
vi.mock("./auth.server", () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));
vi.mock("./auth-guards.server", () => ({
  requireTeamMembership: mocks.requireTeamMembership,
  requireUser: mocks.requireUser,
}));

import { getInvitation, getTeam, getViewer, redeemInvitation } from "./teams.server";

const session = {
  session: { id: "session-1" },
  user: { id: "user-1", name: "Ada" },
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

async function expectHttpResponse(promise: Promise<unknown>, status: number, message: string) {
  const error: unknown = await promise.catch((reason: unknown) => reason);

  expect(error).toBeInstanceOf(Response);
  expect((error as Response).status).toBe(status);
  await expect((error as Response).text()).resolves.toBe(message);
}

describe("team service session boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequestHeaders.mockReturnValue(new Headers());
  });

  test.each([
    [session, { id: "user-1", name: "Ada" }],
    [null, null],
  ])("maps session %j to viewer %j", async (authSession, expected) => {
    mocks.getSession.mockResolvedValue(authSession);

    await expect(getViewer()).resolves.toEqual(expected);
  });

  test("does not read protected team data when membership is denied", async () => {
    mocks.requireTeamMembership.mockRejectedValue(
      new Response("Team membership required", { status: 403 }),
    );

    await expectHttpResponse(getTeam({ teamId: "private-team" }), 403, "Team membership required");
    expect(mocks.createDatabase).not.toHaveBeenCalled();
  });
});

describe("invitation state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test.each([
    {
      expected: { status: "invalid" },
      invitation: undefined,
      name: "invalid",
    },
    {
      expected: { status: "revoked", teamName: "Frontend Guild" },
      invitation: {
        teamName: "Frontend Guild",
        expiresAt: new Date("2026-08-03T12:00:00.000Z"),
        redeemedAt: new Date("2026-08-02T12:00:00.000Z"),
        revokedAt: new Date("2026-08-01T12:00:00.000Z"),
      },
      name: "revoked (before redeemed and expired)",
    },
    {
      expected: { status: "redeemed", teamName: "Frontend Guild" },
      invitation: {
        teamName: "Frontend Guild",
        expiresAt: new Date("2026-08-03T12:00:00.000Z"),
        redeemedAt: new Date("2026-08-02T12:00:00.000Z"),
        revokedAt: null,
      },
      name: "redeemed (before expired)",
    },
    {
      expected: { status: "expired", teamName: "Frontend Guild" },
      invitation: {
        teamName: "Frontend Guild",
        expiresAt: new Date("2026-08-04T12:00:00.000Z"),
        redeemedAt: null,
        revokedAt: null,
      },
      name: "expired at the current instant",
    },
    {
      expected: {
        status: "valid",
        teamName: "Frontend Guild",
        expiresAt: new Date("2026-08-05T12:00:00.000Z"),
      },
      invitation: {
        teamName: "Frontend Guild",
        expiresAt: new Date("2026-08-05T12:00:00.000Z"),
        redeemedAt: null,
        revokedAt: null,
      },
      name: "valid",
    },
  ])("reports an invitation as $name", async ({ invitation, expected }) => {
    mocks.createDatabase.mockReturnValue(selectDatabase(invitation ? [invitation] : []));

    await expect(getInvitation({ token: "a".repeat(43) })).resolves.toEqual(expected);
  });
});

describe("invitation redemption", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-04T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("stops before D1 access when no authenticated session exists", async () => {
    mocks.requireUser.mockRejectedValue(new Response("Authentication required", { status: 401 }));

    await expectHttpResponse(
      redeemInvitation({ token: "a".repeat(43) }),
      401,
      "Authentication required",
    );
    expect(mocks.prepare).not.toHaveBeenCalled();
    expect(mocks.batch).not.toHaveBeenCalled();
  });

  test("rejects an inactive or concurrently consumed invitation with 409", async () => {
    mocks.requireUser.mockResolvedValue(session);
    mocks.prepare.mockImplementation(() => {
      const statement = { bind: vi.fn() };
      statement.bind.mockReturnValue(statement);
      return statement;
    });
    mocks.batch.mockResolvedValue([{ meta: { changes: 0 } }, { meta: { changes: 0 } }]);

    await expectHttpResponse(
      redeemInvitation({ token: "a".repeat(43) }),
      409,
      "Invitation is not active",
    );
    expect(mocks.createDatabase).not.toHaveBeenCalled();
  });

  test("redeems for the authenticated user and returns the joined team", async () => {
    mocks.requireUser.mockResolvedValue(session);
    const statements: { bind: ReturnType<typeof vi.fn> }[] = [];
    mocks.prepare.mockImplementation(() => {
      const statement = { bind: vi.fn() };
      statement.bind.mockReturnValue(statement);
      statements.push(statement);
      return statement;
    });
    mocks.batch.mockResolvedValue([{ meta: { changes: 1 } }, { meta: { changes: 1 } }]);
    mocks.createDatabase.mockReturnValue(selectDatabase([{ teamId: "team-1" }]));

    await expect(redeemInvitation({ token: "a".repeat(43) })).resolves.toEqual({
      teamId: "team-1",
    });

    const now = Date.parse("2026-08-04T12:00:00.000Z");
    expect(statements).toHaveLength(2);
    expect(statements[0]?.bind).toHaveBeenCalledWith(
      now,
      "user-1",
      expect.stringMatching(/^[a-f0-9]{64}$/),
      now,
    );
    expect(statements[1]?.bind).toHaveBeenCalledWith(
      "user-1",
      now,
      expect.stringMatching(/^[a-f0-9]{64}$/),
      now,
      "user-1",
    );
    expect(mocks.batch).toHaveBeenCalledWith(statements);
  });
});
