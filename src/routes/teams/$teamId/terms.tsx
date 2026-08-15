import { createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, Dices } from 'lucide-react';

import { AppHeader } from '#/app/shell/app-header';
import { PageShell } from '#/app/shell/page-container';
import { getTeam, getViewer } from '#/app/teams/api';
import { TermLibrary } from '#/app/teams/terms/team-terms';
import { ButtonLink } from '#/shared/ui/button-link';

export const Route = createFileRoute('/teams/$teamId/terms')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/terms` } });
    }
  },
  loader: ({ params }) => getTeam({ data: { teamId: params.teamId } }),
  component: TeamTermsPage,
});

function TeamTermsPage() {
  const { team, terms } = Route.useLoaderData();
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
            <Dices className='size-8' aria-hidden='true' />
            Bingo terms
          </h1>
        </div>
        <TermLibrary teamId={teamId} terms={terms} />
      </section>
    </PageShell>
  );
}
