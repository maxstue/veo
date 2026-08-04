import { createServerFn } from "@tanstack/react-start";

import { bingoCellCount } from "./bingo-game";

export const getBingoGame = createServerFn({ method: "GET" })
  .validator((input: unknown) => ({ teamId: readId(input, "teamId") }))
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-game.server");
    return implementation.getBingoGame(data);
  });

export const createBingoCard = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ teamId: readId(input, "teamId") }))
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-game.server");
    return implementation.createBingoCard(data);
  });

export const toggleBingoCell = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({
    teamId: readId(input, "teamId"),
    cardId: readId(input, "cardId"),
    position: readPosition(input),
  }))
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-game.server");
    return implementation.toggleBingoCell(data);
  });

export const resetBingoCard = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({
    teamId: readId(input, "teamId"),
    cardId: readId(input, "cardId"),
  }))
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-game.server");
    return implementation.resetBingoCard(data);
  });

function readId(input: unknown, field: string) {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const value = (input as Record<string, unknown>)[field];
  if (typeof value !== "string" || !value || value.length > 100) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}

function readPosition(input: unknown) {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const position = (input as Record<string, unknown>).position;
  if (
    typeof position !== "number" ||
    !Number.isInteger(position) ||
    position < 0 ||
    position >= bingoCellCount
  ) {
    throw new Error("Invalid position");
  }
  return position;
}
