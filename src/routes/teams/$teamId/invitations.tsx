import { createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, Link2 } from 'lucide-react';

import { AppHeader } from '#/app/shell/app-header';
import { getTeam, getViewer } from '#/app/teams/api';
import { TeamInvitations } from '#/app/teams/invitations/team-invitations';
import { ButtonLink } from '#/shared/ui/button-link';

export const Route = createFileRoute('/teams/$teamId/invitations')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/invitations` } });
    }
  },
  loader: async ({ params }) => {
    const data = await getTeam({ data: { teamId: params.teamId } });
    if (data.team.viewerRole !== 'owner') {
      throw redirect({ to: '/teams/$teamId', params: { teamId: params.teamId } });
    }
    return data;
  },
  component: TeamInvitationsPage,
});

function TeamInvitationsPage() {
  const { invitations, team } = Route.useLoaderData();
  const { teamId } = Route.useParams();

  return (
    <main className='mx-auto min-h-screen max-w-3xl px-5 py-5 sm:px-8 lg:px-10'>
      <AppHeader />
      <section className='py-10 sm:py-14'>
        <ButtonLink className='mb-5' params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
          <ArrowLeft aria-hidden='true' />
          Back to team
        </ButtonLink>
        <div className='mb-8'>
          <p className='text-primary text-sm font-medium'>{team.name}</p>
          <h1 className='mt-1 flex items-center gap-2 text-4xl font-semibold tracking-tight'>
            <Link2 className='text-primary size-8 dark:text-violet-300' aria-hidden='true' />
            Invitations
          </h1>
        </div>
        <TeamInvitations invitations={invitations} teamId={teamId} />
      </section>
    </main>
  );
}
