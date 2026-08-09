import { env } from "cloudflare:workers";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";

import { createDatabase } from "#/db/client";
import { bingoCard, bingoCardCell, bingoTerm, team, teamBingoRulesPreset } from "#/db/schema";

import {
  getBingoCellCount,
  getBingoCompletionTime,
  hasBingo,
  selectBingoTerms,
  type BingoRules,
} from "./bingo-game";
import { requireTeamMembership } from "./auth-guards.server";
import { Metrics } from "./observability/metrics";

export async function getBingoGame(data: { teamId: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
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

  if (!card) return { card: null };

  const cells = await database
    .select({
      position: bingoCardCell.position,
      labelSnapshot: bingoCardCell.labelSnapshot,
      markedAt: bingoCardCell.markedAt,
    })
    .from(bingoCardCell)
    .where(eq(bingoCardCell.cardId, card.id))
    .orderBy(asc(bingoCardCell.position));

  return {
    card: {
      id: card.id,
      createdAt: card.createdAt,
      completedAt: card.completedAt,
      rules: readCardRules(card),
      cells,
      bingo: hasBingo(
        cells.filter((cell) => cell.markedAt).map((cell) => cell.position),
        readCardRules(card),
      ),
    },
  };
}

export async function createBingoCard(data: { teamId: string; presetId?: string | null }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
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

  if (!rules) throw new Response("Team not found", { status: 404 });
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
        .where(
          and(eq(teamBingoRulesPreset.id, presetId), eq(teamBingoRulesPreset.teamId, data.teamId)),
        )
        .limit(1)
    : [];
  if (data.presetId && !presets[0]) {
    throw new Response("Bingo rules preset not found", { status: 404 });
  }
  const cardRules = presets[0] ?? rules;
  const cellCount = getBingoCellCount(cardRules.boardSize);

  if (terms.length < cellCount) {
    return { status: "insufficient-terms" as const, available: terms.length, required: cellCount };
  }

  const cardId = crypto.randomUUID();
  const now = new Date();
  const selectedTerms = selectBingoTerms(terms, cellCount);

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

  return { status: "created" as const, cardId };
}

export async function toggleBingoCell(data: { teamId: string; cardId: string; position: number }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
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
    .innerJoin(
      bingoCardCell,
      and(eq(bingoCardCell.cardId, bingoCard.id), eq(bingoCardCell.position, data.position)),
    )
    .where(
      and(
        eq(bingoCard.id, data.cardId),
        eq(bingoCard.teamId, data.teamId),
        eq(bingoCard.userId, session.user.id),
      ),
    )
    .limit(1);
  const match = matches[0];

  if (!match) throw new Response("Bingo cell not found", { status: 404 });

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
}): BingoRules {
  return {
    boardSize: card.boardSize as BingoRules["boardSize"],
    horizontal: card.winHorizontal,
    vertical: card.winVertical,
    diagonal: card.winDiagonal,
  };
}

export async function resetBingoCard(data: { teamId: string; cardId: string }) {
  const { session } = await requireTeamMembership(data.teamId);
  const database = createDatabase(env.DB);
  const cards = await database
    .select({ id: bingoCard.id })
    .from(bingoCard)
    .where(
      and(
        eq(bingoCard.id, data.cardId),
        eq(bingoCard.teamId, data.teamId),
        eq(bingoCard.userId, session.user.id),
      ),
    )
    .limit(1);

  if (!cards[0]) throw new Response("Bingo card not found", { status: 404 });

  await database
    .update(bingoCardCell)
    .set({ markedAt: null })
    .where(eq(bingoCardCell.cardId, data.cardId));

  return { status: "reset" as const };
}
