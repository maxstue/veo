import { createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, Trophy } from 'lucide-react';

import { AppHeader } from '#/app/shell/app-header';
import { PageShell } from '#/app/shell/page-container';
import { getTeam, getViewer } from '#/app/teams/api';
import { TeamLeaderboard } from '#/app/teams/leaderboard/team-leaderboard';
import { ButtonLink } from '#/shared/ui/button-link';

export const Route = createFileRoute('/teams/$teamId/leaderboard')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) {
      throw redirect({
        to: '/auth',
        search: { returnTo: `/teams/${params.teamId}/leaderboard` },
      });
    }
  },
  loader: ({ params }) => getTeam({ data: { teamId: params.teamId } }),
  component: TeamLeaderboardPage,
});

function TeamLeaderboardPage() {
  const { leaderboard, team } = Route.useLoaderData();
  const { teamId } = Route.useParams();

  return (
    <PageShell className='min-h-screen py-5'>
      <AppHeader />
      <section className='py-10 sm:py-14'>
        <ButtonLink className='mb-5' params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
          <ArrowLeft aria-hidden='true' />
          Back to team
        </ButtonLink>
        <div className='mb-8'>
          <p className='text-primary text-sm font-medium'>{team.name}</p>
          <h1 className='mt-1 flex items-center gap-2 text-4xl font-semibold tracking-tight'>
            <Trophy className='text-primary size-8' aria-hidden='true' />
            Team leaderboard
          </h1>
        </div>
        <TeamLeaderboard leaderboard={leaderboard} />
      </section>
    </PageShell>
  );
}
