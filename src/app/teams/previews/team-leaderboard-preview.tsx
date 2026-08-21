import { ChevronRight, Trophy } from 'lucide-react';

import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

type TeamLeaderboardPreviewEntry = {
  activity: 'ranked' | 'playing' | 'inactive';
  completedCards: number;
  id: string;
  name: string;
  rank: number | null;
};

export function TeamLeaderboardPreview({
  leaderboard,
  teamId,
}: {
  leaderboard: TeamLeaderboardPreviewEntry[];
  teamId: string;
}) {
  const leadingMembers = leaderboard.filter((member) => member.activity === 'ranked').slice(0, 5);

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Trophy className='text-primary size-5 dark:text-violet-300' aria-hidden='true' />
          Team leaderboard
        </CardTitle>
        <CardDescription>The top bingo scores in your team.</CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        {leadingMembers.length ? (
          <ol className='grid gap-2' aria-label='Leading team members'>
            {leadingMembers.map((member) => (
              <li className='bg-muted/45 flex items-center gap-3 rounded-lg p-3' key={member.id}>
                <span className='text-primary w-5 shrink-0 text-center text-sm font-semibold'>{member.rank}</span>
                <p className='min-w-0 flex-1 truncate font-medium'>{member.name}</p>
                <p className='text-muted-foreground shrink-0 text-sm'>{formatBingoCount(member.completedCards)}</p>
              </li>
            ))}
          </ol>
        ) : (
          <p className='bg-muted/45 text-muted-foreground rounded-lg p-3 text-sm'>
            Complete a bingo card to start the leaderboard.
          </p>
        )}
        <ButtonLink className='mt-auto w-full' params={{ teamId }} to='/teams/$teamId/leaderboard' variant='outline'>
          View leaderboard
          <ChevronRight aria-hidden='true' />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

function formatBingoCount(count: number) {
  return `${count} ${count === 1 ? 'bingo' : 'bingos'}`;
}
