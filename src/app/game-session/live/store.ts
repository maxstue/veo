import type { SetStateAction } from 'react';

import { createStoreFactory } from '#/shared/lib/store';

import {
  deleteGameSession,
  endGameSession,
  getGameSession,
  rotateGameSessionInvitation,
  startGameSession,
} from '../api';
import { createBingoCard, getBingoGame, resetBingoCard, toggleBingoCell } from '../bingo/bingo-cards';
import { hasBingo } from '../bingo/bingo-game';
import { playBingoWinSound } from '../bingo/bingo-win-sound';
import type { GameSessionCard, GameSessionChatMessage, GameSessionParticipant, GameSessionScore } from './types';

type GameSessionData = Awaited<ReturnType<typeof getGameSession>>;
type BingoGame = Awaited<ReturnType<typeof getBingoGame>> | null;
type ClientGameSessionScore = Omit<GameSessionScore, 'completedAt'> & { completedAt: Date | null };
type LiveCard = ReturnType<typeof normalizeLiveCard>;

type SessionRuntime = {
  invalidate: () => Promise<void>;
  navigateToTeam: () => Promise<void>;
  sendChat: (content: string) => boolean;
};

type GameSessionStoreInput = {
  game: BingoGame;
  runtime: SessionRuntime;
  sessionData: GameSessionData;
  sessionId: string;
  teamId: string;
};

type GameSessionStore = {
  activeSessionId: string | undefined;
  canDelete: boolean;
  card: LiveCard | null;
  celebration: number;
  connected: boolean;
  endDialogOpen: boolean;
  endedBy: string | undefined;
  error: string | undefined;
  game: BingoGame;
  isPending: string | undefined;
  messages: GameSessionChatMessage[];
  participants: GameSessionParticipant[];
  pendingCell: number | undefined;
  presenceKnown: boolean;
  runtime: SessionRuntime | undefined;
  scores: ClientGameSessionScore[];
  session: GameSessionData['session'] | null;
  shareLink: string | undefined;
  teamId: string | undefined;
  viewerUserId: string | undefined;
  activate: (input: GameSessionStoreInput) => void;
  clear: (sessionId: string) => void;
  closeEndDialog: () => void;
  ensureCard: () => Promise<void>;
  createShareLink: () => Promise<void>;
  deleteSession: () => Promise<void>;
  endSession: () => Promise<void>;
  receiveCard: (sessionId: string, card: GameSessionCard) => void;
  receiveMessages: (sessionId: string, messages: SetStateAction<GameSessionChatMessage[]>) => void;
  receiveParticipants: (sessionId: string, participants: GameSessionParticipant[]) => void;
  receiveScore: (sessionId: string, score: GameSessionScore) => void;
  receiveScores: (sessionId: string, scores: GameSessionScore[]) => void;
  requestEnd: () => void;
  resetCard: (cardId: string) => Promise<void>;
  sendChat: (content: string) => boolean;
  setConnected: (sessionId: string, connected: boolean) => void;
  setEndedBy: (sessionId: string, endedBy: string) => void;
  startSession: () => Promise<void>;
  toggleCardCell: (cardId: string, position: number) => Promise<void>;
};

const emptyLiveSessionState = {
  activeSessionId: undefined,
  canDelete: false,
  card: null,
  celebration: 0,
  connected: false,
  endDialogOpen: false,
  endedBy: undefined,
  error: undefined,
  game: null,
  isPending: undefined,
  messages: [],
  participants: [],
  pendingCell: undefined,
  presenceKnown: false,
  runtime: undefined,
  scores: [],
  session: null,
  shareLink: undefined,
  teamId: undefined,
  viewerUserId: undefined,
} satisfies Omit<
  GameSessionStore,
  | 'activate'
  | 'clear'
  | 'closeEndDialog'
  | 'ensureCard'
  | 'createShareLink'
  | 'deleteSession'
  | 'endSession'
  | 'receiveCard'
  | 'receiveMessages'
  | 'receiveParticipants'
  | 'receiveScore'
  | 'receiveScores'
  | 'requestEnd'
  | 'resetCard'
  | 'sendChat'
  | 'setConnected'
  | 'setEndedBy'
  | 'startSession'
  | 'toggleCardCell'
>;

const useGameSessionStore = createStoreFactory<GameSessionStore>('game-session', (set, get) => ({
  ...emptyLiveSessionState,
  activate(input) {
    set((state) => {
      const isSameSession = state.activeSessionId === input.sessionId;
      if (!isSameSession) {
        Object.assign(state, emptyLiveSessionState);
        state.card = input.game?.card ?? null;
        state.scores = input.sessionData.cards;
      }
      state.activeSessionId = input.sessionId;
      state.game = input.game;
      state.runtime = input.runtime;
      state.session = input.sessionData.session;
      state.teamId = input.teamId;
      state.viewerUserId = input.sessionData.viewerUserId;
      state.canDelete = state.presenceKnown
        ? state.participants.every((participant) => participant.userId === input.sessionData.viewerUserId)
        : input.sessionData.canDelete;
    });
  },
  clear(sessionId) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        Object.assign(state, emptyLiveSessionState);
      }
    });
  },
  closeEndDialog() {
    const { activeSessionId: sessionId } = get();
    if (sessionId) {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.endDialogOpen = false;
        }
      });
    }
  },
  async ensureCard() {
    const { activeSessionId: sessionId, card, isPending, runtime, session, teamId } = get();
    if (!runtime || !sessionId || !teamId || session?.status !== 'active' || card || isPending === 'card') {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.error = undefined;
        state.isPending = 'card';
      }
    });
    try {
      const result = await createBingoCard({ data: { teamId, sessionId } });
      if (result.status === 'insufficient-terms') {
        set((state) => {
          if (state.activeSessionId === sessionId) {
            state.error = `${result.required - result.available} more bingo terms are needed to play.`;
          }
        });
        return;
      }
      if (!('card' in result) || !result.card) {
        throw new Error('Session card response missing card state');
      }
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.card = result.card;
        }
      });
    } catch {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error = 'Your card could not be created.';
        }
      });
    } finally {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.isPending = undefined;
        }
      });
    }
  },
  async createShareLink() {
    const { activeSessionId: sessionId, runtime, teamId } = get();
    if (!runtime || !sessionId || !teamId) {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.error = undefined;
        state.isPending = 'link';
      }
    });
    try {
      const { token } = await rotateGameSessionInvitation({ data: { teamId, sessionId } });
      const shareLink = `${window.location.origin}/sessions/join/${token}`;
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.shareLink = shareLink;
        }
      });
      await navigator.clipboard?.writeText(shareLink);
    } catch {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error = 'The invitation link could not be created.';
        }
      });
    } finally {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.isPending = undefined;
        }
      });
    }
  },
  async deleteSession() {
    const { activeSessionId: sessionId, runtime, teamId } = get();
    if (!runtime || !sessionId || !teamId || !window.confirm('Delete this session and all of its temporary data?')) {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.error = undefined;
        state.isPending = 'delete';
      }
    });
    try {
      await deleteGameSession({ data: { teamId, sessionId } });
      await runtime.navigateToTeam();
    } catch (cause) {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error =
            cause instanceof Response && cause.status === 409
              ? 'The session cannot be deleted while another participant is connected.'
              : 'The session could not be deleted.';
          state.isPending = undefined;
        }
      });
    }
  },
  async endSession() {
    const { activeSessionId: sessionId, runtime, teamId } = get();
    if (!runtime || !sessionId || !teamId) {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.endDialogOpen = false;
        state.error = undefined;
        state.isPending = 'end';
      }
    });
    try {
      await endGameSession({ data: { teamId, sessionId } });
      await runtime.invalidate();
    } catch {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error = 'The session could not be ended.';
        }
      });
    } finally {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.isPending = undefined;
        }
      });
    }
  },
  receiveCard(sessionId, card) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.card = normalizeLiveCard(card);
      }
    });
  },
  receiveMessages(sessionId, messages) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.messages = typeof messages === 'function' ? messages(state.messages) : messages;
      }
    });
  },
  receiveParticipants(sessionId, participants) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.canDelete = participants.every((participant) => participant.userId === state.viewerUserId);
        state.participants = participants;
        state.presenceKnown = true;
      }
    });
  },
  receiveScore(sessionId, score) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.scores = mergeScore(state.scores, score);
      }
    });
  },
  receiveScores(sessionId, scores) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.scores = scores.map(normalizeLiveScore);
      }
    });
  },
  requestEnd() {
    const { activeSessionId: sessionId, participants } = get();
    if (!sessionId) {
      return;
    }
    if (participants.length > 1) {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.endDialogOpen = true;
        }
      });
      return;
    }
    void get().endSession();
  },
  async resetCard(cardId) {
    const { activeSessionId: sessionId, runtime, teamId } = get();
    if (!runtime || !sessionId || !teamId || !window.confirm('Clear all marks on your card?')) {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.error = undefined;
        state.isPending = 'reset';
      }
    });
    try {
      const result = await resetBingoCard({ data: { teamId, sessionId, cardId } });
      if (!('card' in result) || !result.card) {
        throw new Error('Session card response missing card state');
      }
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.card = result.card;
        }
      });
    } catch {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error = 'The marks could not be cleared.';
        }
      });
    } finally {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.isPending = undefined;
        }
      });
    }
  },
  sendChat(content) {
    return get().runtime?.sendChat(content) ?? false;
  },
  setConnected(sessionId, connected) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.connected = connected;
      }
    });
  },
  setEndedBy(sessionId, endedBy) {
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.endedBy = endedBy;
      }
    });
  },
  async startSession() {
    const { activeSessionId: sessionId, runtime, teamId } = get();
    if (!runtime || !sessionId || !teamId) {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.error = undefined;
        state.isPending = 'start';
      }
    });
    try {
      await startGameSession({ data: { teamId, sessionId } });
      await runtime.invalidate();
    } catch {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error = 'The session could not be started.';
        }
      });
    } finally {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.isPending = undefined;
        }
      });
    }
  },
  async toggleCardCell(cardId, position) {
    const { activeSessionId: sessionId, card, game, pendingCell, runtime, teamId } = get();
    if (
      !runtime ||
      !sessionId ||
      !teamId ||
      !game ||
      !card ||
      card.id !== cardId ||
      pendingCell !== undefined ||
      card.bingo
    ) {
      return;
    }
    set((state) => {
      if (state.activeSessionId === sessionId) {
        state.error = undefined;
        state.pendingCell = position;
      }
    });
    const selectedCell = card.cells.find((cell) => cell.position === position);
    const markedPositions = card.cells
      .filter((cell) => (cell.position === position ? !selectedCell?.marked : cell.marked))
      .map((cell) => cell.position);
    const winsWithThisMark = !selectedCell?.marked && hasBingo(markedPositions, card.rules);
    if (winsWithThisMark && game.winnerSoundConfig) {
      playBingoWinSound(game.winnerSoundConfig);
    }
    try {
      const result = await toggleBingoCell({ data: { teamId, sessionId, cardId, position } });
      if (!('card' in result) || !result.card) {
        throw new Error('Session card response missing card state');
      }
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.card = result.card;
          if (result.card.bingo && !card.bingo) {
            state.celebration += 1;
          }
        }
      });
    } catch {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.error = 'The mark could not be saved.';
        }
      });
    } finally {
      set((state) => {
        if (state.activeSessionId === sessionId) {
          state.pendingCell = undefined;
        }
      });
    }
  },
}));

function mergeScore(scores: ClientGameSessionScore[], score: GameSessionScore) {
  return [...scores.filter((candidate) => candidate.userId !== score.userId), normalizeLiveScore(score)];
}

function normalizeLiveScore(score: GameSessionScore) {
  return { ...score, completedAt: score.completedAt ? new Date(score.completedAt) : null };
}

function normalizeLiveCard(card: GameSessionCard) {
  return {
    ...card,
    completedAt: card.completedAt ? new Date(card.completedAt) : null,
    createdAt: new Date(card.createdAt),
  };
}

export { useGameSessionStore };
