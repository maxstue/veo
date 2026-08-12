import { env } from 'cloudflare:workers';
import { and, asc, desc, eq, isNotNull } from 'drizzle-orm';

import { requireTeamMembership } from '#/app/auth/guards.server';
import { createDatabase } from '#/shared/lib/db/client';
import { bingoCard, bingoCardCell, bingoTerm, gameSession, team, teamBingoRulesPreset } from '#/shared/lib/db/schema';
import { Metrics } from '#/shared/lib/observability/metrics';

import type { GameSessionCard } from '../live/types';
import { getBingoCellCount, getBingoCompletionTime, hasBingo, selectBingoTerms, type BingoRules } from './bingo-game';
import { defaultWinnerSoundConfig, parseWinnerSoundConfig } from './bingo-win-sound-config';

export async function getBingoGame(data: { teamId: string; sessionId?: string | null }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const winnerSoundConfig = await getWinnerSoundConfig();
  if (data.sessionId) {
    await requireActiveGameSession(database, data.teamId, data.sessionId);
    const card = await env.GAME_SESSION.getByName(data.sessionId).readCard(session.user.id);
    if (!card) {
      return { card: null, winnerSoundConfig };
    }
    try {
      return { card: toClientCard(card), winnerSoundConfig };
    } finally {
      card[Symbol.dispose]();
    }
  }
  const cards = await database
    .select({
      id: bingoCard.id,
      createdAt: bingoCard.createdAt,
      completedAt: bingoCard.completedAt,
      boardSize: bingoCard.boardSize,
      winHorizontal: bingoCard.winHorizontal,
      winVertical: bingoCard.winVertical,
      winDiagonal: bingoCard.winDiagonal,
    })
    .from(bingoCard)
    .where(and(eq(bingoCard.teamId, data.teamId), eq(bingoCard.userId, session.user.id)))
    .orderBy(desc(bingoCard.createdAt))
    .limit(1);
  const card = cards[0];

  if (!card) {
    return { card: null, winnerSoundConfig };
  }

  const storedCells = await database
    .select({
      position: bingoCardCell.position,
      labelSnapshot: bingoCardCell.labelSnapshot,
      markedAt: bingoCardCell.markedAt,
    })
    .from(bingoCardCell)
    .where(eq(bingoCardCell.cardId, card.id))
    .orderBy(asc(bingoCardCell.position));

  const cells = storedCells.map((cell) => ({
    labelSnapshot: cell.labelSnapshot,
    marked: Boolean(cell.markedAt),
    position: cell.position,
  }));
  return {
    winnerSoundConfig,
    card: {
      id: card.id,
      createdAt: card.createdAt,
      completedAt: card.completedAt,
      rules: readCardRules(card),
      cells,
      bingo: hasBingo(
        cells.filter((cell) => cell.marked).map((cell) => cell.position),
        readCardRules(card),
      ),
    },
  };
}

async function getWinnerSoundConfig() {
  try {
    const namespace = (env as Env & { VEO_SOUND_CONFIG?: KVNamespace }).VEO_SOUND_CONFIG;
    if (!namespace) {
      Metrics.recordWinnerSoundConfigFailed('binding-missing');
      return defaultWinnerSoundConfig;
    }
    const value = await namespace.get('audio-config', { cacheTtl: 60, type: 'json' });
    if (value === null) {
      Metrics.recordWinnerSoundConfigFailed('key-missing');
      return defaultWinnerSoundConfig;
    }
    const config = parseWinnerSoundConfig(value);
    if (!config) {
      Metrics.recordWinnerSoundConfigFailed('invalid');
    }
    return config ?? defaultWinnerSoundConfig;
  } catch {
    Metrics.recordWinnerSoundConfigFailed('unavailable');
    return defaultWinnerSoundConfig;
  }
}

export async function createBingoCard(data: { teamId: string; sessionId?: string | null; presetId?: string | null }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  if (data.sessionId) {
    await requireActiveGameSession(database, data.teamId, data.sessionId);
  }
  const terms = await database
    .select({ id: bingoTerm.id, label: bingoTerm.label })
    .from(bingoTerm)
    .where(eq(bingoTerm.teamId, data.teamId));
  const teams = await database
    .select({
      boardSize: team.bingoBoardSize,
      horizontal: team.bingoWinHorizontal,
      vertical: team.bingoWinVertical,
      diagonal: team.bingoWinDiagonal,
      defaultPresetId: team.defaultBingoRulesPresetId,
    })
    .from(team)
    .where(eq(team.id, data.teamId))
    .limit(1);
  const rules = teams[0];

  if (!rules) {
    throw new Response('Team not found', { status: 404 });
  }
  const presetId = data.presetId === undefined ? rules.defaultPresetId : data.presetId;
  const presets = presetId
    ? await database
        .select({
          boardSize: teamBingoRulesPreset.boardSize,
          horizontal: teamBingoRulesPreset.winHorizontal,
          vertical: teamBingoRulesPreset.winVertical,
          diagonal: teamBingoRulesPreset.winDiagonal,
        })
        .from(teamBingoRulesPreset)
        .where(and(eq(teamBingoRulesPreset.id, presetId), eq(teamBingoRulesPreset.teamId, data.teamId)))
        .limit(1)
    : [];
  if (data.presetId && !presets[0]) {
    throw new Response('Bingo rules preset not found', { status: 404 });
  }
  const cardRules = presets[0] ?? rules;
  const cellCount = getBingoCellCount(cardRules.boardSize);

  if (terms.length < cellCount) {
    return { status: 'insufficient-terms' as const, available: terms.length, required: cellCount };
  }

  const cardId = crypto.randomUUID();
  const now = new Date();
  const selectedTerms = selectBingoTerms(terms, cellCount);

  if (data.sessionId) {
    const result = await env.GAME_SESSION.getByName(data.sessionId).createCard({
      cells: selectedTerms.map((term, position) => ({ label: term.label, position })),
      createdAt: now.getTime(),
      rules: {
        boardSize: cardRules.boardSize as BingoRules['boardSize'],
        diagonal: cardRules.diagonal,
        horizontal: cardRules.horizontal,
        vertical: cardRules.vertical,
      },
      userId: session.user.id,
      userName: session.user.name,
    });
    try {
      if (result.status === 'created') {
        Metrics.recordGameStarted();
      }
      return { card: toClientCard(result.card), cardId: session.user.id, status: result.status };
    } finally {
      result[Symbol.dispose]();
    }
  }

  await database.batch([
    database.insert(bingoCard).values({
      id: cardId,
      teamId: data.teamId,
      userId: session.user.id,
      boardSize: cardRules.boardSize,
      winHorizontal: cardRules.horizontal,
      winVertical: cardRules.vertical,
      winDiagonal: cardRules.diagonal,
      createdAt: now,
    }),
    ...selectedTerms.map((term, position) =>
      database.insert(bingoCardCell).values({
        cardId,
        position,
        sourceTermId: term.id,
        labelSnapshot: term.label,
      }),
    ),
  ]);

  Metrics.recordGameStarted();

  return { status: 'created' as const, cardId };
}

export async function toggleBingoCell(data: {
  teamId: string;
  sessionId?: string | null;
  cardId: string;
  position: number;
}) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  if (data.sessionId) {
    await requireActiveGameSession(database, data.teamId, data.sessionId);
    if (data.cardId !== session.user.id) {
      throw new Response('Bingo card not found', { status: 404 });
    }
    const result = await env.GAME_SESSION.getByName(data.sessionId).toggleCell(session.user.id, data.position);
    if (!result) {
      throw new Response('Bingo cell not found', { status: 404 });
    }
    try {
      if (result.completedNow) {
        Metrics.recordGameCompleted();
      }
      return {
        bingo: result.card.bingo,
        card: toClientCard(result.card),
        completedAt: result.card.completedAt ? new Date(result.card.completedAt) : null,
        marked: result.marked,
      };
    } finally {
      result[Symbol.dispose]();
    }
  }
  const matches = await database
    .select({
      markedAt: bingoCardCell.markedAt,
      completedAt: bingoCard.completedAt,
      boardSize: bingoCard.boardSize,
      winHorizontal: bingoCard.winHorizontal,
      winVertical: bingoCard.winVertical,
      winDiagonal: bingoCard.winDiagonal,
    })
    .from(bingoCard)
    .innerJoin(bingoCardCell, and(eq(bingoCardCell.cardId, bingoCard.id), eq(bingoCardCell.position, data.position)))
    .where(and(eq(bingoCard.id, data.cardId), eq(bingoCard.teamId, data.teamId), eq(bingoCard.userId, session.user.id)))
    .limit(1);
  const match = matches[0];

  if (!match) {
    throw new Response('Bingo cell not found', { status: 404 });
  }

  const markedAt = match.markedAt ? null : new Date();
  await database
    .update(bingoCardCell)
    .set({ markedAt })
    .where(and(eq(bingoCardCell.cardId, data.cardId), eq(bingoCardCell.position, data.position)));

  const markedCells = await database
    .select({ position: bingoCardCell.position })
    .from(bingoCardCell)
    .where(and(eq(bingoCardCell.cardId, data.cardId), isNotNull(bingoCardCell.markedAt)));
  const bingo = hasBingo(
    markedCells.map((cell) => cell.position),
    readCardRules(match),
  );
  const completedAt = getBingoCompletionTime(match.completedAt, bingo, new Date());

  await database.update(bingoCard).set({ completedAt }).where(eq(bingoCard.id, data.cardId));

  if (bingo && !match.completedAt) {
    Metrics.recordGameCompleted();
  }

  return { marked: Boolean(markedAt), bingo, completedAt };
}

function readCardRules(card: {
  boardSize: number;
  winHorizontal: boolean;
  winVertical: boolean;
  winDiagonal: boolean;
}) {
  return {
    boardSize: card.boardSize as BingoRules['boardSize'],
    horizontal: card.winHorizontal,
    vertical: card.winVertical,
    diagonal: card.winDiagonal,
  };
}

export async function resetBingoCard(data: { teamId: string; sessionId?: string | null; cardId: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  if (data.sessionId) {
    await requireActiveGameSession(database, data.teamId, data.sessionId);
    if (data.cardId !== session.user.id) {
      throw new Response('Bingo card not found', { status: 404 });
    }
    const result = await env.GAME_SESSION.getByName(data.sessionId).resetCard(session.user.id);
    if (!result) {
      throw new Response('Bingo card not found', { status: 404 });
    }
    try {
      return { card: toClientCard(result.card), status: 'reset' as const };
    } finally {
      result[Symbol.dispose]();
    }
  }
  const cards = await database
    .select({ id: bingoCard.id })
    .from(bingoCard)
    .where(and(eq(bingoCard.id, data.cardId), eq(bingoCard.teamId, data.teamId), eq(bingoCard.userId, session.user.id)))
    .limit(1);

  if (!cards[0]) {
    throw new Response('Bingo card not found', { status: 404 });
  }

  await database.update(bingoCardCell).set({ markedAt: null }).where(eq(bingoCardCell.cardId, data.cardId));

  return { status: 'reset' as const };
}

function toClientCard(card: GameSessionCard) {
  return {
    ...card,
    completedAt: card.completedAt ? new Date(card.completedAt) : null,
    createdAt: new Date(card.createdAt),
  };
}

async function requireActiveGameSession(
  database: ReturnType<typeof createDatabase>,
  teamId: string,
  sessionId: string,
) {
  const sessions = await database
    .select({ id: gameSession.id })
    .from(gameSession)
    .where(and(eq(gameSession.id, sessionId), eq(gameSession.teamId, teamId), eq(gameSession.status, 'active')))
    .limit(1);

  if (!sessions[0]) {
    throw new Response('Active game session required', { status: 409 });
  }
}
