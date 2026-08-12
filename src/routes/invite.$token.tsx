import { createFileRoute } from '@tanstack/react-router';

import { InvitationCard, InvitationLayout } from '#/app/invitations/invitation-page';
import { getInvitation, getViewer } from '#/app/teams/api';

export const Route = createFileRoute('/invite/$token')({
  loader: async ({ params }) => ({
    invitation: await getInvitation({ data: { token: params.token } }),
    viewer: await getViewer(),
  }),
  component: InvitationRoute,
});

function InvitationRoute() {
  const { invitation, viewer } = Route.useLoaderData();
  const { token } = Route.useParams();
  return (
    <InvitationLayout>
      <InvitationCard invitation={invitation} token={token} viewer={viewer} />
    </InvitationLayout>
  );
}
