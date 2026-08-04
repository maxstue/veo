import { createServerFn } from "@tanstack/react-start";

import { maximumBingoTermLength, parseBingoTermLabel } from "./bingo-term-label";

export const createBingoTerm = createServerFn({ method: "POST" })
  .validator(readTermInput)
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-terms.server");
    return implementation.createBingoTerm(data);
  });

export const updateBingoTerm = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({ ...readTermInput(input), termId: readId(input, "termId") }))
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-terms.server");
    return implementation.updateBingoTerm(data);
  });

export const deleteBingoTerm = createServerFn({ method: "POST" })
  .validator((input: unknown) => ({
    teamId: readId(input, "teamId"),
    termId: readId(input, "termId"),
  }))
  .handler(async ({ data }) => {
    const implementation = await import("./bingo-terms.server");
    return implementation.deleteBingoTerm(data);
  });

function readTermInput(input: unknown) {
  const teamId = readId(input, "teamId");
  const label = readString(input, "label");
  return { teamId, label: parseBingoTermLabel(label).label };
}

function readId(input: unknown, field: string) {
  const value = readString(input, field);
  if (!value || value.length > 100) throw new Error(`Invalid ${field}`);
  return value;
}

function readString(input: unknown, field: string) {
  if (!input || typeof input !== "object") throw new Error("Invalid input");
  const value = (input as Record<string, unknown>)[field];
  if (typeof value !== "string" || value.length > maximumBingoTermLength + 20) {
    throw new Error(`Invalid ${field}`);
  }
  return value;
}
