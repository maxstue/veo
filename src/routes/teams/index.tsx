import { createFileRoute, redirect } from '@tanstack/react-router';

import { getViewer, listTeams } from '#/app/teams/api';
import { CreateTeam, TeamList, TeamsGrid, TeamsHeading, TeamsLayout } from '#/app/teams/teams-page';

export const Route = createFileRoute('/teams/')({
  beforeLoad: async () => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: '/teams' } });
    }
  },
  loader: () => listTeams(),
  component: TeamsRoute,
});

function TeamsRoute() {
  const teams = Route.useLoaderData();
  return (
    <TeamsLayout>
      <TeamsHeading />
      <TeamsGrid>
        <TeamList teams={teams} />
        <CreateTeam />
      </TeamsGrid>
    </TeamsLayout>
  );
}
