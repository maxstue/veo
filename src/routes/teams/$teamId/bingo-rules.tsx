import { createFileRoute, redirect } from '@tanstack/react-router';
import { ArrowLeft, Settings2 } from 'lucide-react';

import { AppHeader } from '#/app/shell/app-header';
import { getTeam, getViewer } from '#/app/teams/api';
import { BingoRulesLibrary } from '#/app/teams/team-bingo-rules';
import { ButtonLink } from '#/shared/ui/button-link';

export const Route = createFileRoute('/teams/$teamId/bingo-rules')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/bingo-rules` } });
    }
  },
  loader: ({ params }) => getTeam({ data: { teamId: params.teamId } }),
  component: TeamBingoRulesPage,
});

function TeamBingoRulesPage() {
  const { bingoRulesPresets, team } = Route.useLoaderData();
  const { teamId } = Route.useParams();

  return (
    <main className='mx-auto min-h-screen max-w-4xl px-5 py-5 sm:px-8 lg:px-10'>
      <AppHeader />
      <section className='py-10 sm:py-14'>
        <ButtonLink className='mb-5' params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
          <ArrowLeft aria-hidden='true' />
          Back to team
        </ButtonLink>
        <div className='mb-8'>
          <p className='text-primary text-sm font-medium'>{team.name}</p>
          <h1 className='mt-1 flex items-center gap-2 text-4xl font-semibold tracking-tight'>
            <Settings2 className='size-8' aria-hidden='true' />
            Bingo rules
          </h1>
        </div>
        <BingoRulesLibrary
          defaultPresetId={team.defaultBingoRulesPresetId}
          presets={bingoRulesPresets}
          rules={team.bingoRules}
          teamId={teamId}
        />
      </section>
    </main>
  );
}
