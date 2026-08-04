import { createServerFn } from "@tanstack/react-start";

export const getViewer = createServerFn({ method: "GET" }).handler(async () => {
  const implementation = await import("./teams.server");
  return implementation.getViewer();
});

export const listTeams = createServerFn({ method: "GET" }).handler(async () => {
  const implementation = await import("./teams.server");
  return implementation.listTeams();
});

export const createTeam = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ name: readString(input, "name", 2, 80) }))
  .handler(async ({ data }) => {
    const implementation = await import("./teams.server");
    return implementation.createTeam(data);
  });

export const getTeam = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ teamId: readId(input, "teamId") }))
  .handler(async ({ data }) => {
    const implementation = await import("./teams.server");
    return implementation.getTeam(data);
  });

export const createInvitation = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ teamId: readId(input, "teamId") }))
  .handler(async ({ data }) => {
    const implementation = await import("./teams.server");
    return implementation.createInvitation(data);
  });

export const revokeInvitation = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({
    teamId: readId(input, "teamId"),
    invitationId: readId(input, "invitationId"),
  }))
  .handler(async ({ data }) => {
    const implementation = await import("./teams.server");
    return implementation.revokeInvitation(data);
  });

export const getInvitation = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ token: readToken(input) }))
  .handler(async ({ data }) => {
    const implementation = await import("./teams.server");
    return implementation.getInvitation(data);
  });

export const redeemInvitation = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ token: readToken(input) }))
  .handler(async ({ data }) => {
    const implementation = await import("./teams.server");
    return implementation.redeemInvitation(data);
  });

function readToken(input: unknown) {
  const token = readString(input, "token", 40, 100, false);
  if (!/^[A-Za-z0-9_-]+$/.test(token)) throw new Error("Invalid invitation token");
  return token;
}

function readId(input: unknown, field: string) {
  return readString(input, field, 1, 100, false);
}

function readString(input: unknown, field: string, min: number, max: number, trim = true) {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const value = (input as Record<string, unknown>)[field];
  if (typeof value !== "string") throw new Error(`Invalid ${field}`);
  const normalized = trim ? value.trim().replace(/\s+/g, " ") : value;
  if (normalized.length < min || normalized.length > max) throw new Error(`Invalid ${field}`);
  return normalized;
}
