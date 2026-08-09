import { createServerFn } from '@tanstack/react-start';

import { supportedBingoBoardSizes } from './bingo-game';

export const getViewer = createServerFn({ method: 'GET' }).handler(async () => {
  const implementation = await import('./teams.server');
  return implementation.getViewer();
});

export const listTeams = createServerFn({ method: 'GET' }).handler(async () => {
  const implementation = await import('./teams.server');
  return implementation.listTeams();
});

export const createTeam = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ name: readString(input, 'name', 2, 80) }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.createTeam(data);
  });

export const getTeam = createServerFn({ method: 'GET' })
  .validator((input: unknown) => ({ teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.getTeam(data);
  });

export const saveTeamBingoRulesPreset = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({
    ...readBingoRules(input),
    name: readString(input, 'name', 1, 50),
  }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.saveTeamBingoRulesPreset(data);
  });

export const setTeamDefaultBingoRulesPreset = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({
    teamId: readId(input, 'teamId'),
    presetId: readId(input, 'presetId'),
  }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.setTeamDefaultBingoRulesPreset(data);
  });

export const createInvitation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ teamId: readId(input, 'teamId') }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.createInvitation(data);
  });

export const revokeInvitation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({
    teamId: readId(input, 'teamId'),
    invitationId: readId(input, 'invitationId'),
  }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.revokeInvitation(data);
  });

export const getInvitation = createServerFn({ method: 'GET' })
  .validator((input: unknown) => ({ token: readToken(input) }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.getInvitation(data);
  });

export const redeemInvitation = createServerFn({ method: 'POST' })
  .validator((input: unknown) => ({ token: readToken(input) }))
  .handler(async ({ data }) => {
    const implementation = await import('./teams.server');
    return implementation.redeemInvitation(data);
  });

function readToken(input: unknown) {
  const token = readString(input, 'token', 40, 100, false);
  if (!/^[A-Za-z0-9_-]+$/.test(token)) {
    throw new Error('Invalid invitation token');
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
    throw new Error(`Invalid ${field}`);
  }
  const normalized = trim ? value.trim().replace(/\s+/g, ' ') : value;
  if (normalized.length < min || normalized.length > max) {
    throw new Error(`Invalid ${field}`);
  }
  return normalized;
}

function readBingoRules(input: unknown) {
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input');
  }
  const values = input as Record<string, unknown>;
  const boardSize = values.boardSize;
  const horizontal = values.horizontal;
  const vertical = values.vertical;
  const diagonal = values.diagonal;

  if (
    typeof boardSize !== 'number' ||
    !supportedBingoBoardSizes.includes(boardSize as (typeof supportedBingoBoardSizes)[number]) ||
    typeof horizontal !== 'boolean' ||
    typeof vertical !== 'boolean' ||
    typeof diagonal !== 'boolean' ||
    (!horizontal && !vertical && !diagonal)
  ) {
    throw new Error('Invalid bingo rules');
  }

  return { teamId: readId(input, 'teamId'), boardSize, horizontal, vertical, diagonal };
}
