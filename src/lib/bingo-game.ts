export const bingoBoardSize = 5;
export const bingoCellCount = bingoBoardSize * bingoBoardSize;

const winningLines = createWinningLines();

export function hasBingo(markedPositions: Iterable<number>) {
  const marked = new Set(markedPositions);
  return winningLines.some((line) => line.every((position) => marked.has(position)));
}

/** Keeps a completed bingo in the team's score even when a card is reset later. */
export function getBingoCompletionTime(completedAt: Date | null, bingo: boolean, now: Date) {
  return completedAt ?? (bingo ? now : null);
}

export function selectBingoTerms<T>(terms: readonly T[], randomIndex = secureRandomIndex) {
  if (terms.length < bingoCellCount) {
    throw new Error(`At least ${bingoCellCount} bingo terms are required`);
  }

  const shuffled = [...terms];
  for (let current = shuffled.length - 1; current > 0; current -= 1) {
    const selected = randomIndex(current + 1);
    if (!Number.isInteger(selected) || selected < 0 || selected > current) {
      throw new Error("Random index is outside the requested range");
    }
    [shuffled[current], shuffled[selected]] = [shuffled[selected]!, shuffled[current]!];
  }

  return shuffled.slice(0, bingoCellCount);
}

function createWinningLines() {
  const rows = Array.from({ length: bingoBoardSize }, (_, row) =>
    Array.from({ length: bingoBoardSize }, (_, column) => row * bingoBoardSize + column),
  );
  const columns = Array.from({ length: bingoBoardSize }, (_, column) =>
    Array.from({ length: bingoBoardSize }, (_, row) => row * bingoBoardSize + column),
  );
  const diagonals = [
    Array.from({ length: bingoBoardSize }, (_, index) => index * (bingoBoardSize + 1)),
    Array.from({ length: bingoBoardSize }, (_, index) => (index + 1) * (bingoBoardSize - 1)),
  ];

  return [...rows, ...columns, ...diagonals];
}

function secureRandomIndex(upperBound: number) {
  const maximum = 2 ** 32;
  const unbiasedLimit = maximum - (maximum % upperBound);
  const value = new Uint32Array(1);

  do crypto.getRandomValues(value);
  while (value[0]! >= unbiasedLimit);

  return value[0]! % upperBound;
}
