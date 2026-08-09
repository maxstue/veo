export const bingoBoardSize = 5;
export const bingoCellCount = bingoBoardSize * bingoBoardSize;
export const supportedBingoBoardSizes = [3, 4, 5, 6, 7, 8] as const;

export type BingoBoardSize = (typeof supportedBingoBoardSizes)[number];
export type BingoRules = {
  boardSize: BingoBoardSize;
  horizontal: boolean;
  vertical: boolean;
  diagonal: boolean;
};

export const defaultBingoRules: BingoRules = {
  boardSize: bingoBoardSize,
  horizontal: true,
  vertical: true,
  diagonal: true,
};

export function getBingoCellCount(boardSize: number) {
  return boardSize * boardSize;
}

export function hasBingo(markedPositions: Iterable<number>, rules: BingoRules = defaultBingoRules) {
  const marked = new Set(markedPositions);
  return createWinningLines(rules).some((line) => line.every((position) => marked.has(position)));
}

/** Keeps a completed bingo in the team's score even when a card is reset later. */
export function getBingoCompletionTime(completedAt: Date | null, bingo: boolean, now: Date) {
  return completedAt ?? (bingo ? now : null);
}

type RandomIndex = (upperBound: number) => number;

export function selectBingoTerms<T>(terms: readonly T[], randomIndex?: RandomIndex): T[];
export function selectBingoTerms<T>(
  terms: readonly T[],
  cellCount: number,
  randomIndex?: RandomIndex,
): T[];
export function selectBingoTerms<T>(
  terms: readonly T[],
  cellCountOrRandomIndex: number | RandomIndex = bingoCellCount,
  suppliedRandomIndex: RandomIndex = secureRandomIndex,
) {
  const cellCount =
    typeof cellCountOrRandomIndex === "function" ? bingoCellCount : cellCountOrRandomIndex;
  const randomIndex =
    typeof cellCountOrRandomIndex === "function" ? cellCountOrRandomIndex : suppliedRandomIndex;

  if (terms.length < cellCount) {
    throw new Error(`At least ${cellCount} bingo terms are required`);
  }

  const shuffled = [...terms];
  for (let current = shuffled.length - 1; current > 0; current -= 1) {
    const selected = randomIndex(current + 1);
    if (!Number.isInteger(selected) || selected < 0 || selected > current) {
      throw new Error("Random index is outside the requested range");
    }
    [shuffled[current], shuffled[selected]] = [shuffled[selected]!, shuffled[current]!];
  }

  return shuffled.slice(0, cellCount);
}

function createWinningLines({ boardSize, horizontal, vertical, diagonal }: BingoRules) {
  const rows = Array.from({ length: boardSize }, (_, row) =>
    Array.from({ length: boardSize }, (_, column) => row * boardSize + column),
  );
  const columns = Array.from({ length: boardSize }, (_, column) =>
    Array.from({ length: boardSize }, (_, row) => row * boardSize + column),
  );
  const diagonals = [
    Array.from({ length: boardSize }, (_, index) => index * (boardSize + 1)),
    Array.from({ length: boardSize }, (_, index) => (index + 1) * (boardSize - 1)),
  ];

  return [
    ...(horizontal ? rows : []),
    ...(vertical ? columns : []),
    ...(diagonal ? diagonals : []),
  ];
}

function secureRandomIndex(upperBound: number) {
  const maximum = 2 ** 32;
  const unbiasedLimit = maximum - (maximum % upperBound);
  const value = new Uint32Array(1);

  do crypto.getRandomValues(value);
  while (value[0]! >= unbiasedLimit);

  return value[0]! % upperBound;
}
