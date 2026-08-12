import { Trophy, Users } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import type { GameSessionParticipant } from './types';

type Score = {
  bingo: boolean;
  boardSize: number;
  completedAt: Date | null;
  longestLine: number;
  userId: string;
  userName: string;
};

function LiveScoreboard({ participants, scores }: { participants: GameSessionParticipant[]; scores: Score[] }) {
  const sortedScores = [...scores].sort((left, right) => {
    if (left.completedAt && right.completedAt) {
      return left.completedAt.getTime() - right.completedAt.getTime();
    }
    if (left.completedAt) {
      return -1;
    }
    if (right.completedAt) {
      return 1;
    }
    return right.longestLine - left.longestLine || left.userName.localeCompare(right.userName);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Users className='size-4' aria-hidden='true' />
          Live score
        </CardTitle>
        <CardDescription>{participants.length} online</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedScores.length ? (
          <ol className='space-y-2 text-sm'>
            {sortedScores.map((score, index) => (
              <li className='flex items-center justify-between gap-2' key={score.userId}>
                <span className='truncate'>
                  {index + 1}. {score.userName}
                </span>
                <span className='flex shrink-0 items-center gap-1.5 font-medium'>
                  {score.longestLine} / {score.boardSize}
                  {score.completedAt && <Trophy className='text-primary size-4' aria-label='Bingo' />}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className='text-muted-foreground text-sm'>No cards yet.</p>
        )}
        {participants.length > 0 && (
          <p className='text-muted-foreground mt-4 text-xs'>
            {participants.map((participant) => participant.userName).join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export { LiveScoreboard };
