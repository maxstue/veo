import { describe, expect, test } from "vite-plus/test";

import { parseBingoTermLabel } from "./bingo-term-label";

describe("bingo term labels", () => {
  test("normalizes whitespace and compatibility characters", () => {
    expect(parseBingoTermLabel("  Daily\tＡlignment  ")).toEqual({
      label: "Daily Alignment",
      normalizedLabel: "daily alignment",
    });
  });

  test("uses a case-insensitive comparison label", () => {
    expect(parseBingoTermLabel("BLOCKER").normalizedLabel).toBe(
      parseBingoTermLabel("blocker").normalizedLabel,
    );
  });

  test.each(["", "  \n ", "x".repeat(81)])("rejects invalid labels", (label) => {
    expect(() => parseBingoTermLabel(label)).toThrow();
  });
});
