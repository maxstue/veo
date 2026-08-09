import { createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, Link2 } from 'lucide-react';

import { AppHeader } from '#/components/app-header';
import { TeamInvitations } from '#/components/team-invitations';
import { ButtonLink } from '#/components/ui/button-link';
import { getTeam, getViewer } from '#/lib/teams';

export const Route = createFileRoute('/teams/$teamId_/invitations')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer()))
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/invitations` } });
  },
  loader: ({ params }) => getTeam({ data: { teamId: params.teamId } }),
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
