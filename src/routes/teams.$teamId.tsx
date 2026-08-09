import { createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, Dices } from 'lucide-react';

import { AppHeader } from '#/components/app-header';
import { TeamBingoRulesPreview } from '#/components/team-bingo-rules';
import { TeamInvitationsPreview } from '#/components/team-invitations';
import { TeamLeaderboardPreview } from '#/components/team-leaderboard';
import { TeamMembersPreview } from '#/components/team-members';
import { TeamTermsPreview } from '#/components/team-terms';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent } from '#/components/ui/card';
import { getTeam, getViewer } from '#/lib/teams';

export const Route = createFileRoute('/teams/$teamId')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}` } });
  },
  loader: ({ params }) => getTeam({ data: { teamId: params.teamId } }),
  component: TeamPage,
});

function TeamPage() {
  const data = Route.useLoaderData();
  const { teamId } = Route.useParams();

  return (
    <main className='mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10'>
      <AppHeader />
      <section className='py-10 sm:py-14'>
        <ButtonLink className='mb-5' size='sm' to='/teams' variant='ghost'>
          <ArrowLeft aria-hidden='true' />
          All teams
        </ButtonLink>
        <div className='mb-8'>
          <p className='text-primary text-sm font-medium dark:text-violet-300'>Team overview</p>
          <h1 className='mt-1 text-4xl font-semibold tracking-tight'>{data.team.name}</h1>
        </div>

        <div className='grid gap-5 lg:grid-cols-2'>
          <Card className='border-primary/25 from-primary/10 via-card to-card bg-linear-to-br lg:col-span-2'>
            <CardContent className='flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-4'>
                <span className='bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-xl'>
                  <Dices className='text-primary size-6 dark:text-violet-300' aria-hidden='true' />
                </span>
                <div>
                  <h2 className='font-semibold'>Ready for a team bingo?</h2>
                  <p className='text-muted-foreground mt-1 text-sm'>Shuffle your personal card and start playing.</p>
                </div>
              </div>
              <ButtonLink
                className='shadow-primary/25 hover:shadow-primary/35 h-11 px-5 text-base shadow-lg'
                params={{ teamId }}
                size='lg'
                to='/teams/$teamId/play'
              >
                <Dices className='size-5' aria-hidden='true' />
                Start bingo
              </ButtonLink>
            </CardContent>
          </Card>

          <TeamMembersPreview members={data.members} teamId={teamId} />
          <TeamTermsPreview teamId={teamId} terms={data.terms} />
          <TeamBingoRulesPreview presets={data.bingoRulesPresets} rules={data.team.bingoRules} teamId={teamId} />
          <TeamLeaderboardPreview leaderboard={data.leaderboard} teamId={teamId} />
          <TeamInvitationsPreview invitations={data.invitations} teamId={teamId} />
        </div>
      </section>
    </main>
  );
}
