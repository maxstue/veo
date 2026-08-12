import { createServerFn } from '@tanstack/react-start';

export const listGameSessions = createServerFn({ method: 'GET' })
  .validator((input: unknown) => ({ teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.listGameSessions(data);
  });

export const getGameSession = createServerFn({ method: 'GET' })
  .validator((input: unknown) => ({ sessionId: readId(input, 'sessionId'), teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.getGameSession(data);
  });

export const createGameSession = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.createGameSession(data);
  });

export const startGameSession = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ sessionId: readId(input, 'sessionId'), teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.startGameSession(data);
  });

export const endGameSession = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ sessionId: readId(input, 'sessionId'), teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.endGameSession(data);
  });

export const deleteGameSession = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ sessionId: readId(input, 'sessionId'), teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.deleteGameSession(data);
  });

export const rotateGameSessionInvitation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ sessionId: readId(input, 'sessionId'), teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.rotateGameSessionInvitation(data);
  });

export const getGameSessionInvitation = createServerFn({ method: 'GET' })
  .validator((input: unknown) => ({ token: readToken(input) }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.getGameSessionInvitation(data);
  });

export const redeemGameSessionInvitation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ token: readToken(input) }))
  .handler(async ({ data }) => {
    const implementation = await import('./game-sessions.server');
    return implementation.redeemGameSessionInvitation(data);
  });

function readToken(input: unknown) {
  const token = readString(input, 'token', 40, 100, false);
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new Error('Invalid game session token');
  }
  return token;
}

function readId(input: unknown, field: string) {
  return readString(input, field, 1, 100, false);
}

function readString(input: unknown, field: string, min: number, max: number, trim = true) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input');
  }
  const value = (input as Record<string, unknown>)[field];
  if (typeof value !== 'string') {
    throw new TypeError(`Invalid ${field}`);
  }
  const normalized = trim ? value.trim().replace(/\s+/g, ' ') : value;
  if (normalized.length < min || normalized.length > max) {
    throw new Error(`Invalid ${field}`);
  }
  return normalized;
}
