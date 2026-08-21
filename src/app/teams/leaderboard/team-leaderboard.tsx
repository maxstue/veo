import { Card, CardContent, CardDescription, CardHeader } from '#/shared/ui/card';

export type TeamLeaderboardEntry = {
  activity: 'ranked' | 'playing' | 'inactive';
  cardsStarted: number;
  completedCards: number;
  id: string;
  name: string;
  rank: number | null;
};

export function TeamLeaderboard({ leaderboard }: { leaderboard: TeamLeaderboardEntry[] }) {
  const rankedMembers = leaderboard.filter((member) => member.activity === 'ranked');

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          Completed bingo cards set the score. Equal scores share a place; only this team can see the leaderboard.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-5'>
        {rankedMembers.length ? (
          <ol className='grid gap-2' aria-label='Ranked team members'>
            {rankedMembers.map((member) => (
              <li className='bg-muted/35 flex items-center gap-3 rounded-lg border p-3' key={member.id}>
                <span
                  aria-label={`Place ${member.rank}`}
                  className='bg-primary/10 text-primary flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold'
                >
                  {member.rank}
                </span>
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
      </CardContent>
    </Card>
  );
}

function formatBingoCount(count: number) {
  return `${count} ${count === 1 ? 'bingo' : 'bingos'}`;
}
