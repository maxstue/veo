import type { BingoBoardSize } from './bingo-game';

export type GameSessionParticipant = {
  userId: string;
  userName: string;
};

export type GameSessionCardRules = {
  boardSize: BingoBoardSize;
  diagonal: boolean;
  horizontal: boolean;
  vertical: boolean;
};

export type GameSessionCard = {
  id: string;
  bingo: boolean;
  cells: Array<{
    labelSnapshot: string;
    marked: boolean;
    position: number;
  }>;
  completedAt: number | null;
  createdAt: number;
  rules: GameSessionCardRules;
};

export type GameSessionCardSeed = GameSessionParticipant & {
  cells: Array<{ label: string; position: number }>;
  createdAt: number;
  rules: GameSessionCardRules;
};

export type GameSessionChatMessage = GameSessionParticipant & {
  id: number;
  content: string;
  createdAt: number;
};

export type GameSessionScore = GameSessionParticipant & {
  bingo: boolean;
  boardSize: BingoBoardSize;
  completedAt: number | null;
  longestLine: number;
};

export type GameSessionResult = {
  completedAt: number | null;
  userId: string;
};

export type GameSessionLiveEvent =
  | { type: 'card-updated'; card: GameSessionCard }
  | { type: 'chat-message'; message: GameSessionChatMessage }
  | { type: 'presence'; participants: GameSessionParticipant[] }
  | { type: 'score-updated'; score: GameSessionScore }
  | { type: 'session-started' }
  | { type: 'session-ended' }
  | { type: 'session-deleted' }
  | {
      type: 'snapshot';
      card: GameSessionCard | null;
      messages: GameSessionChatMessage[];
      participants: GameSessionParticipant[];
      scores: GameSessionScore[];
    };
