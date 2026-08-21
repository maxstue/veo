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
