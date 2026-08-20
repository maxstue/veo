import { createFileRoute } from '@tanstack/react-router';

import { getGameSessionInvitation } from '#/app/game-session/api';
import { GameSessionInvitationCard, GameSessionInvitationLayout } from '#/app/game-session/invitation-page';

export const Route = createFileRoute('/sessions/join/$token')({
  loader: async ({ context, params }) => ({
    invitation: await getGameSessionInvitation({ data: { token: params.token } }),
    viewer: context.session ? { id: context.session.user.id, name: context.session.user.name } : null,
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
