import { beforeEach, describe, expect, test, vi } from "vite-plus/test";

const mocks = vi.hoisted(() => ({
  createDatabase: vi.fn(),
  getRequestHeaders: vi.fn(),
  getSession: vi.fn(),
}));

vi.mock("cloudflare:workers", () => ({ env: { DB: { binding: "test" } } }));
vi.mock("@tanstack/react-start/server", () => ({
  getRequestHeaders: mocks.getRequestHeaders,
}));
vi.mock("#/db/client", () => ({ createDatabase: mocks.createDatabase }));
vi.mock("./auth.server", () => ({
  getAuth: () => ({ api: { getSession: mocks.getSession } }),
}));

import { requireTeamMembership, requireUser } from "./auth-guards.server";

const session = {
  session: { id: "session-1" },
  user: { id: "user-1", name: "Ada" },
};

function membershipDatabase(rows: { teamId: string }[]) {
  const query = {
    from: vi.fn(),
    limit: vi.fn().mockResolvedValue(rows),
    where: vi.fn(),
  };
  query.from.mockReturnValue(query);
  query.where.mockReturnValue(query);

  return { select: vi.fn().mockReturnValue(query) };
}

async function expectHttpResponse(promise: Promise<unknown>, status: number, message: string) {
  const error: unknown = await promise.catch((reason: unknown) => reason);

  expect(error).toBeInstanceOf(Response);
  expect((error as Response).status).toBe(status);
  await expect((error as Response).text()).resolves.toBe(message);
}

describe("authentication guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getRequestHeaders.mockReturnValue(new Headers({ cookie: "session=test" }));
  });

  test("returns the active session using the current request headers", async () => {
    mocks.getSession.mockResolvedValue(session);

    await expect(requireUser()).resolves.toBe(session);
    expect(mocks.getSession).toHaveBeenCalledWith({ headers: expect.any(Headers) });
  });

  test("rejects a request without an active session with 401", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expectHttpResponse(requireUser(), 401, "Authentication required");
  });

  test("returns the authenticated membership for the requested team", async () => {
    mocks.getSession.mockResolvedValue(session);
    const database = membershipDatabase([{ teamId: "team-1" }]);
    mocks.createDatabase.mockReturnValue(database);

    await expect(requireTeamMembership("team-1")).resolves.toEqual({
      session,
      teamId: "team-1",
    });
    expect(database.select).toHaveBeenCalledOnce();
  });

  test("rejects an authenticated non-member with 403", async () => {
    mocks.getSession.mockResolvedValue(session);
    mocks.createDatabase.mockReturnValue(membershipDatabase([]));

    await expectHttpResponse(
      requireTeamMembership("private-team"),
      403,
      "Team membership required",
    );
  });

  test("does not query team membership when authentication fails", async () => {
    mocks.getSession.mockResolvedValue(null);

    await expectHttpResponse(requireTeamMembership("team-1"), 401, "Authentication required");
    expect(mocks.createDatabase).not.toHaveBeenCalled();
  });
});
