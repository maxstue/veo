import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Dices, LoaderCircle, RotateCcw, Trophy } from 'lucide-react';
import { type CSSProperties, useOptimistic, useState, useTransition } from 'react';

import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { createBingoCard, getBingoGame, resetBingoCard, toggleBingoCell } from '#/lib/bingo-cards';
import { hasBingo } from '#/lib/bingo-game';
import { getTeam, getViewer } from '#/lib/teams';

export const Route = createFileRoute('/teams/$teamId_/play')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/play` } });
  },
  loader: async ({ params }) => {
    const [teamData, game] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getBingoGame({ data: { teamId: params.teamId } }),
    ]);
    return {
      team: teamData.team,
      termCount: teamData.terms.length,
      presets: teamData.bingoRulesPresets,
      game,
    };
  },
  component: BingoPage,
});

function BingoPage() {
  const { game, presets, team, termCount } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState<string>();
  const [celebration, setCelebration] = useState(0);
  const [presetId, setPresetId] = useState(team.defaultBingoRulesPresetId ?? '');
  const [isTogglingCell, startToggleTransition] = useTransition();
  const [card, updateOptimisticCell] = useOptimistic(
    game.card,
    (currentCard, { marked, position }: { marked: boolean; position: number }) => {
      if (!currentCard) return currentCard;

      const cells = currentCard.cells.map((cell) =>
        cell.position === position ? { ...cell, markedAt: marked ? new Date() : null } : cell,
      );
      return {
        ...currentCard,
        cells,
        bingo: hasBingo(
          cells.filter((cell) => cell.markedAt).map((cell) => cell.position),
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
    if (card?.id !== cardId) return;

    setError(undefined);
    const hadBingo = card.bingo;
    const marked = !card.cells.find((cell) => cell.position === position)?.markedAt;
    startToggleTransition(async () => {
      updateOptimisticCell({ marked, position });
      try {
        const result = await toggleBingoCell({ data: { teamId, cardId, position } });
        if (result.bingo && !hadBingo) setCelebration((value) => value + 1);
        await router.invalidate();
      } catch {
        setError('The mark could not be saved.');
      }
    });
  }

  async function reset(cardId: string) {
    if (!window.confirm('Clear all marks on this card?')) return;
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

  return (
    <main className='mx-auto grid h-dvh max-w-5xl grid-rows-[auto_minmax(0,1fr)] gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5'>
      {celebration > 0 && <Confetti key={celebration} />}

      <header>
        <ButtonLink params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
          <ArrowLeft aria-hidden='true' />
          Back
        </ButtonLink>
      </header>

      <section className='grid min-h-0 grid-rows-[auto_minmax(0,1fr)] justify-items-center gap-3'>
        <div className='flex w-full max-w-4xl flex-wrap items-end justify-between gap-3'>
          <div>
            <p className='text-primary text-sm font-medium'>{team.name}</p>
            <h1 className='mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl'>
              {card?.bingo ? <Trophy className='text-primary size-8' /> : <Dices className='size-8' />}
              {card?.bingo ? 'Bingo!' : 'Your bingo card'}
            </h1>
            <p className='text-muted-foreground mt-1 text-sm'>
              {getGameInstructions(Boolean(card), termCount, card?.rules.boardSize ?? selectedBoardSize)}
            </p>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            {presets.length > 0 && (
              <label className='flex items-center gap-2 text-sm'>
                <span className='sr-only'>Card template</span>
                <select
                  className='bg-background h-7 max-w-48 rounded-lg border px-2 text-[0.8rem]'
                  disabled={Boolean(pending) || isTogglingCell}
                  onChange={(event) => setPresetId(event.target.value)}
                  value={presetId}
                >
                  <option value=''>
                    Team rules ({team.bingoRules.boardSize}×{team.bingoRules.boardSize})
                  </option>
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.name} ({preset.boardSize}×{preset.boardSize})
                    </option>
                  ))}
                </select>
              </label>
            )}
            {card && (
              <Button
                className={isTogglingCell ? 'disabled:opacity-100' : undefined}
                disabled={Boolean(pending) || isTogglingCell}
                onClick={() => void reset(card.id)}
                size='sm'
                variant='outline'
              >
                <RotateCcw aria-hidden='true' />
                Clear marks
              </Button>
            )}
            <Button
              className={isTogglingCell ? 'disabled:opacity-100' : undefined}
              disabled={Boolean(pending) || isTogglingCell || termCount < Math.pow(selectedBoardSize, 2)}
              onClick={() => void createCard()}
              size='sm'
            >
              {pending === 'create' ? (
                <LoaderCircle className='animate-spin' aria-hidden='true' />
              ) : (
                <Dices aria-hidden='true' />
              )}
              {card ? 'Reshuffle' : 'Shuffle card'}
            </Button>
          </div>
        </div>

        <div className='flex min-h-0 w-full items-center justify-center'>
          {card ? (
            <fieldset
              className={`bg-card/80 grid aspect-square w-full max-w-full flex-none gap-1.5 rounded-xl border p-2 shadow-xl backdrop-blur sm:h-full sm:max-h-full sm:w-auto sm:gap-3 sm:p-4 ${
                card.bingo ? 'border-primary shadow-primary/15' : ''
              }`}
              style={{ gridTemplateColumns: `repeat(${card.rules.boardSize}, minmax(0, 1fr))` }}
            >
              <legend className='sr-only'>Bingo card</legend>
              {card.cells.map((cell) => {
                const marked = Boolean(cell.markedAt);
                return (
                  <button
                    aria-label={`${cell.labelSnapshot}${marked ? ', marked' : ', not marked'}`}
                    aria-pressed={marked}
                    className={`aspect-square min-w-0 rounded-lg border p-1 text-[0.62rem] leading-tight font-medium transition duration-200 sm:p-3 sm:text-sm lg:text-base ${
                      marked
                        ? 'border-primary bg-primary text-primary-foreground scale-[0.97] shadow-md'
                        : 'bg-background hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5'
                    }`}
                    disabled={Boolean(pending) || isTogglingCell}
                    key={cell.position}
                    onClick={() => toggle(card.id, cell.position)}
                    type='button'
                  >
                    <span className='line-clamp-4'>{cell.labelSnapshot}</span>
                  </button>
                );
              })}
            </fieldset>
          ) : (
            <div className='bg-card/70 flex h-full max-h-96 w-full max-w-4xl flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center'>
              <span className='bg-primary/10 text-primary mb-3 flex size-14 items-center justify-center rounded-lg'>
                <Dices className='size-7' aria-hidden='true' />
              </span>
              <h2 className='text-xl font-semibold'>Ready for your bingo?</h2>
              <p className='text-muted-foreground mt-1 max-w-md text-sm'>
                Your card is shuffled once from the team's terms and remains stable afterwards.
              </p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className='pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6'>
          <p
            className='animate-in fade-in slide-in-from-bottom-4 border-destructive/20 bg-background text-destructive rounded-lg border px-4 py-2 text-sm shadow-xl duration-300'
            role='alert'
          >
            {error}
          </p>
        </div>
      )}
    </main>
  );
}

const confettiColors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function getGameInstructions(hasCard: boolean, termCount: number, boardSize: number) {
  if (hasCard) {
    return 'Tap a cell when you hear the term. Everything is saved automatically.';
  }
  const requiredTerms = Math.pow(boardSize, 2);
  if (termCount >= requiredTerms) {
    return `Shuffle your personal ${boardSize}×${boardSize} card and start playing.`;
  }

  const missingTerms = requiredTerms - termCount;
  const subject = missingTerms === 1 ? 'term is' : 'terms are';
  return `${missingTerms} more ${subject} needed before you can play ${boardSize}×${boardSize}.`;
}

function Confetti() {
  return (
    <div aria-hidden='true' className='pointer-events-none fixed inset-0 z-50 overflow-hidden'>
      {Array.from({ length: 70 }, (_, index) => {
        const style = {
          '--confetti-color': confettiColors[index % confettiColors.length],
          '--confetti-delay': `${(index % 14) * 0.035}s`,
          '--confetti-drift': `${((index * 53) % 41) - 20}vw`,
          '--confetti-duration': `${2.6 + (index % 7) * 0.18}s`,
          '--confetti-left': `${(index * 37) % 100}%`,
          '--confetti-spin': `${360 + (index % 5) * 180}deg`,
        } as CSSProperties;

        return <i className='veo-confetti' key={index} style={style} />;
      })}
    </div>
  );
}
