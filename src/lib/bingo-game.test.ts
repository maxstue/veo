import { describe, expect, test } from "vite-plus/test";

import {
  bingoCellCount,
  getBingoCompletionTime,
  hasBingo,
  selectBingoTerms,
  type BingoRules,
} from "./bingo-game";

describe("bingo detection", () => {
  test.each([
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [0, 5, 10, 15, 20],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ])("recognizes a complete winning line", (...positions) => {
    expect(hasBingo(positions)).toBe(true);
  });

  test("does not recognize an incomplete or unrelated set", () => {
    expect(hasBingo([0, 1, 2, 3, 5, 6, 7, 8])).toBe(false);
  });

  test("uses only the team's configured patterns and card size", () => {
    const horizontalOnly: BingoRules = {
      boardSize: 8,
      horizontal: true,
      vertical: false,
      diagonal: false,
    };

    expect(hasBingo([0, 8, 16, 24, 32, 40, 48, 56], horizontalOnly)).toBe(false);
    expect(hasBingo([56, 57, 58, 59, 60, 61, 62, 63], horizontalOnly)).toBe(true);
  });

  test("keeps an achieved bingo in the score after the card changes", () => {
    const completedAt = new Date("2026-08-06T08:00:00.000Z");

    expect(getBingoCompletionTime(null, false, completedAt)).toBeNull();
    expect(getBingoCompletionTime(null, true, completedAt)).toBe(completedAt);
    expect(getBingoCompletionTime(completedAt, false, new Date("2026-08-06T09:00:00.000Z"))).toBe(
      completedAt,
    );
  });
});

describe("bingo term selection", () => {
  test("selects 25 unique terms without changing the source list", () => {
    const terms = Array.from({ length: 30 }, (_, id) => ({ id }));
    const selected = selectBingoTerms(terms, () => 0);

    expect(selected).toHaveLength(bingoCellCount);
    expect(new Set(selected.map((term) => term.id))).toHaveLength(bingoCellCount);
    expect(terms.map((term) => term.id)).toEqual(Array.from({ length: 30 }, (_, id) => id));
  });

  test("requires enough terms for a full card", () => {
    expect(() => selectBingoTerms(Array.from({ length: 24 }), () => 0)).toThrow(
      "At least 25 bingo terms are required",
    );
  });

  test("selects the requested number of terms for larger cards", () => {
    const selected = selectBingoTerms(Array.from({ length: 64 }), 64, () => 0);

    expect(selected).toHaveLength(64);
  });
});
