import { Dices, LoaderCircle, Trophy } from 'lucide-react';
import { type CSSProperties } from 'react';

import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import type { GameSessionCard } from '../live/types';

type BingoCardData = Omit<GameSessionCard, 'completedAt' | 'createdAt'> & {
  completedAt: Date | null;
  createdAt: Date;
};

function BingoCard({
  card,
  disabled,
  pendingCell,
  resetting,
  onReset,
  onToggle,
}: {
  card: BingoCardData | null;
  disabled: boolean;
  pendingCell: number | undefined;
  resetting: boolean;
  onReset: (cardId: string) => void;
  onToggle: (cardId: string, position: number) => void;
}) {
  return (
    <Card className={card?.bingo ? 'border-primary shadow-primary/15 shadow-xl' : undefined}>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {card?.bingo ? <Trophy className='text-primary' aria-hidden='true' /> : <Dices aria-hidden='true' />}
          {card?.bingo ? 'Bingo!' : 'Your bingo card'}
        </CardTitle>
        <CardDescription>
          {card ? 'Mark a term when it comes up in the meeting.' : 'Create your personal card to join the game.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {card ? (
          <BingoBoard
            card={card}
            disabled={disabled}
            onReset={onReset}
            onToggle={onToggle}
            pendingCell={pendingCell}
            resetting={resetting}
          />
        ) : (
          <output className='text-muted-foreground flex items-center gap-2 text-sm'>
            <LoaderCircle className='size-4 animate-spin' aria-hidden='true' />
            Preparing your card…
          </output>
        )}
      </CardContent>
    </Card>
  );
}

function BingoBoard({
  card,
  disabled,
  pendingCell,
  resetting,
  onReset,
  onToggle,
}: {
  card: BingoCardData;
  disabled: boolean;
  pendingCell: number | undefined;
  resetting: boolean;
  onReset: (cardId: string) => void;
  onToggle: (cardId: string, position: number) => void;
}) {
  return (
    <>
      <fieldset
        aria-label='Bingo card'
        className='grid gap-2'
        style={{ gridTemplateColumns: `repeat(${card.rules.boardSize}, minmax(0, 1fr))` }}
      >
        {card.cells.map((cell) => (
          <button
            aria-label={`${cell.labelSnapshot}${cell.marked ? ', marked' : ', not marked'}`}
            aria-pressed={cell.marked}
            className={`aspect-square min-w-0 rounded-lg border p-1 text-[0.62rem] leading-tight font-medium transition sm:p-3 sm:text-sm ${
              cell.marked
                ? 'border-primary bg-primary text-primary-foreground scale-[0.97] shadow-md'
                : 'bg-background hover:border-primary/50 hover:bg-primary/5'
            }`}
            disabled={pendingCell !== undefined || disabled || card.bingo}
            key={cell.position}
            onClick={() => onToggle(card.id, cell.position)}
            type='button'
          >
            <span className='line-clamp-4'>{cell.labelSnapshot}</span>
          </button>
        ))}
      </fieldset>
      <Button className='mt-4' disabled={disabled || card.bingo} onClick={() => onReset(card.id)} variant='outline'>
        {resetting && <LoaderCircle className='animate-spin' aria-hidden='true' />}
        Clear marks
      </Button>
    </>
  );
}

const confettiColors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function BingoConfetti() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none fixed inset-0 z-50 overflow-hidden'
      data-testid='bingo-confetti'
    >
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

export { BingoCard, BingoConfetti };
