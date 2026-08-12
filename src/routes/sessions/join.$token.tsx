import { createFileRoute } from '@tanstack/react-router';

import { getGameSessionInvitation } from '#/app/game-session/api';
import { GameSessionInvitationCard, GameSessionInvitationLayout } from '#/app/game-session/invitation-page';
import { getViewer } from '#/app/teams/api';

export const Route = createFileRoute('/sessions/join/$token')({
  loader: async ({ params }) => ({
    invitation: await getGameSessionInvitation({ data: { token: params.token } }),
    viewer: await getViewer(),
  }),
  component: GameSessionInvitationRoute,
});

function GameSessionInvitationRoute() {
  const { invitation, viewer } = Route.useLoaderData();
  const { token } = Route.useParams();
  return (
    <GameSessionInvitationLayout>
      <GameSessionInvitationCard invitation={invitation} token={token} viewer={viewer} />
    </GameSessionInvitationLayout>
  );
}
