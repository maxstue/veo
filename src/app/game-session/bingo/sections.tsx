import { ArrowLeft, Dices, LoaderCircle, RotateCcw, Trophy } from 'lucide-react';

import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';

import { getBingoGame } from './bingo-cards';
import { type BingoGameState } from './use-bingo-game';

type Game = Awaited<ReturnType<typeof getBingoGame>>;
type Card = Game['card'];

function BingoGameLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className='mx-auto grid h-dvh max-w-5xl grid-rows-[auto_minmax(0,1fr)] gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5'>
      {children}
    </main>
  );
}

function BingoGameBackLink({ teamId }: { teamId: string }) {
  return (
    <header>
      <ButtonLink params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
        <ArrowLeft aria-hidden='true' /> Back
      </ButtonLink>
    </header>
  );
}

function BingoGameToolbar({
  boardSize,
  card,
  disabled,
  pending,
  presetId,
  presets,
  team,
  termCount,
  onCreate,
  onPresetChange,
  onReset,
}: {
  boardSize: number;
  card: Card;
  disabled: boolean;
  pending: string | undefined;
  presetId: string;
  presets: BingoGameState['presets'];
  team: BingoGameState['team'];
  termCount: number;
  onCreate: () => void;
  onPresetChange: (presetId: string) => void;
  onReset: (cardId: string) => void;
}) {
  return (
    <div className='flex w-full max-w-4xl flex-wrap items-end justify-between gap-3'>
      <div>
        <p className='text-primary text-sm font-medium'>{team.name}</p>
        <h1 className='mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl'>
          {card?.bingo ? <Trophy className='text-primary size-8' /> : <Dices className='size-8' />}
          {card?.bingo ? 'Bingo!' : 'Your bingo card'}
        </h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          {getGameInstructions(Boolean(card), termCount, card?.rules.boardSize ?? boardSize)}
        </p>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        {presets.length > 0 && (
          <label className='flex items-center gap-2 text-sm'>
            <span className='sr-only'>Card template</span>
            <select
              className='bg-background h-7 max-w-48 rounded-lg border px-2 text-[0.8rem]'
              disabled={Boolean(pending) || disabled}
              onChange={(event) => onPresetChange(event.target.value)}
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
            className={disabled ? 'disabled:opacity-100' : undefined}
            disabled={Boolean(pending) || disabled}
            onClick={() => onReset(card.id)}
            size='sm'
            variant='outline'
          >
            <RotateCcw aria-hidden='true' /> Clear marks
          </Button>
        )}
        <Button
          className={disabled ? 'disabled:opacity-100' : undefined}
          disabled={Boolean(pending) || disabled || termCount < Math.pow(boardSize, 2)}
          onClick={onCreate}
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
  );
}

function BingoGameBoard({
  card,
  disabled,
  onToggle,
}: {
  card: NonNullable<Card>;
  disabled: boolean;
  onToggle: (cardId: string, position: number) => void;
}) {
  return (
    <fieldset
      className={`bg-card/80 grid aspect-square w-full max-w-full flex-none gap-1.5 rounded-xl border p-2 shadow-xl backdrop-blur sm:h-full sm:max-h-full sm:w-auto sm:gap-3 sm:p-4 ${card.bingo ? 'border-primary shadow-primary/15' : ''}`}
      style={{ gridTemplateColumns: `repeat(${card.rules.boardSize}, minmax(0, 1fr))` }}
    >
      <legend className='sr-only'>Bingo card</legend>
      {card.cells.map((cell) => (
        <button
          aria-label={`${cell.labelSnapshot}${cell.marked ? ', marked' : ', not marked'}`}
          aria-pressed={cell.marked}
          className={`aspect-square min-w-0 rounded-lg border p-1 text-[0.62rem] leading-tight font-medium transition duration-200 sm:p-3 sm:text-sm lg:text-base ${cell.marked ? 'border-primary bg-primary text-primary-foreground scale-[0.97] shadow-md' : 'bg-background hover:border-primary/50 hover:bg-primary/5 hover:-translate-y-0.5'}`}
          disabled={disabled}
          key={cell.position}
          onClick={() => onToggle(card.id, cell.position)}
          type='button'
        >
          <span className='line-clamp-4'>{cell.labelSnapshot}</span>
        </button>
      ))}
    </fieldset>
  );
}

function BingoGameEmptyState() {
  return (
    <div className='bg-card/70 flex h-full max-h-96 w-full max-w-4xl flex-col items-center justify-center rounded-xl border border-dashed p-6 text-center'>
      <span className='bg-primary/10 text-primary mb-3 flex size-14 items-center justify-center rounded-lg'>
        <Dices className='size-7' aria-hidden='true' />
      </span>
      <h2 className='text-xl font-semibold'>Ready for your bingo?</h2>
      <p className='text-muted-foreground mt-1 max-w-md text-sm'>
        Your card is shuffled once from the team's terms and remains stable afterwards.
      </p>
    </div>
  );
}

function BingoGameError({ message }: { message: string }) {
  return (
    <div className='pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6'>
      <p
        className='animate-in fade-in slide-in-from-bottom-4 border-destructive/20 bg-background text-destructive rounded-lg border px-4 py-2 text-sm shadow-xl duration-300'
        role='alert'
      >
        {message}
      </p>
    </div>
  );
}

function getGameInstructions(hasCard: boolean, termCount: number, boardSize: number) {
  if (hasCard) {
    return 'Tap a cell when you hear the term. Everything is saved automatically.';
  }
  const requiredTerms = Math.pow(boardSize, 2);
  if (termCount >= requiredTerms) {
    return `Shuffle your personal ${boardSize}×${boardSize} card and start playing.`;
  }
  const missingTerms = requiredTerms - termCount;
  return `${missingTerms} more ${missingTerms === 1 ? 'term is' : 'terms are'} needed before you can play ${boardSize}×${boardSize}.`;
}

export { BingoGameBackLink, BingoGameBoard, BingoGameEmptyState, BingoGameError, BingoGameLayout, BingoGameToolbar };
