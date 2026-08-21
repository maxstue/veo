import { useRouter } from '@tanstack/react-router';
import { useOptimistic, useState, useTransition } from 'react';

import { type BingoRules } from '#/shared/lib/bingo-rules';

import { createBingoCard, getBingoGame, resetBingoCard, toggleBingoCell } from './bingo-cards';
import { hasBingo } from './bingo-game';
import { playBingoWinSound } from './bingo-win-sound';

type TeamBingoGameData = {
  bingoRulesPresets: Array<{ boardSize: number; id: string; name: string }>;
  team: {
    bingoRules: Omit<BingoRules, 'boardSize'> & { boardSize: number };
    defaultBingoRulesPresetId: string | null;
    name: string;
  };
  terms: unknown[];
};

type BingoGameState = {
  boardSize: number;
  card: Awaited<ReturnType<typeof getBingoGame>>['card'];
  celebration: number;
  error: string | undefined;
  isTogglingCell: boolean;
  pending: string | undefined;
  presetId: string;
  presets: TeamBingoGameData['bingoRulesPresets'];
  team: TeamBingoGameData['team'];
  termCount: number;
  createCard: () => void;
  resetCard: (cardId: string) => void;
  selectPreset: (presetId: string) => void;
  toggleCell: (cardId: string, position: number) => void;
};

function useBingoGame({
  game,
  teamData,
  teamId,
}: {
  game: Awaited<ReturnType<typeof getBingoGame>>;
  teamData: TeamBingoGameData;
  teamId: string;
}) {
  const { bingoRulesPresets: presets, team, terms } = teamData;
  const termCount = terms.length;
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState<string>();
  const [celebration, setCelebration] = useState(0);
  const [presetId, setPresetId] = useState(team.defaultBingoRulesPresetId ?? '');
  const [isTogglingCell, startToggleTransition] = useTransition();
  const [card, updateOptimisticCell] = useOptimistic(
    game.card,
    (currentCard, { marked, position }: { marked: boolean; position: number }) => {
      if (!currentCard) {
        return currentCard;
      }

      const cells = currentCard.cells.map((cell) => (cell.position === position ? { ...cell, marked } : cell));
      return {
        ...currentCard,
        cells,
        bingo: hasBingo(
          cells.filter((cell) => cell.marked).map((cell) => cell.position),
          currentCard.rules,
        ),
      };
    },
  );
  const selectedPreset = presets.find((preset) => preset.id === presetId);
  const selectedBoardSize = selectedPreset?.boardSize ?? team.bingoRules.boardSize;

  async function createCard() {
    if (card && !window.confirm('Create a new card and replace the current one?')) {
      return;
    }
    setError(undefined);
    setPending('create');
    try {
      const result = await createBingoCard({ data: { teamId, presetId: presetId || null } });
      if (result.status === 'insufficient-terms') {
        setError(`${result.required - result.available} more bingo terms are needed to create a card.`);
        return;
      }
      await router.invalidate();
    } catch {
      setError('The card could not be created.');
    } finally {
      setPending(undefined);
    }
  }

  function toggle(cardId: string, position: number) {
    if (card?.id !== cardId) {
      return;
    }

    setError(undefined);
    const hadBingo = card.bingo;
    const marked = !card.cells.find((cell) => cell.position === position)?.marked;
    startToggleTransition(async () => {
      updateOptimisticCell({ marked, position });
      try {
        const result = await toggleBingoCell({ data: { teamId, cardId, position } });
        if (result.bingo && !hadBingo) {
          if (game.winnerSoundConfig) {
            playBingoWinSound(game.winnerSoundConfig);
          }
          setCelebration((value) => value + 1);
        }
        await router.invalidate();
      } catch {
        setError('The mark could not be saved.');
      }
    });
  }

  async function reset(cardId: string) {
    if (!window.confirm('Clear all marks on this card?')) {
      return;
    }
    setError(undefined);
    setPending('reset');
    try {
      await resetBingoCard({ data: { teamId, cardId } });
      await router.invalidate();
    } catch {
      setError('The marks could not be cleared.');
    } finally {
      setPending(undefined);
    }
  }

  return {
    boardSize: selectedBoardSize,
    card,
    celebration,
    createCard: () => void createCard(),
    error,
    isTogglingCell,
    pending,
    presetId,
    presets,
    resetCard: (cardId: string) => void reset(cardId),
    selectPreset: setPresetId,
    team,
    termCount,
    toggleCell: toggle,
  };
}

export { useBingoGame };
export type { BingoGameState, TeamBingoGameData };
