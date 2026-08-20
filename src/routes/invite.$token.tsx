import { createFileRoute } from '@tanstack/react-router';

import { InvitationCard, InvitationLayout } from '#/app/invitations/invitation-page';
import { getInvitation } from '#/app/teams/api';

export const Route = createFileRoute('/invite/$token')({
  loader: async ({ context, params }) => ({
    invitation: await getInvitation({ data: { token: params.token } }),
    viewer: context.session ? { id: context.session.user.id, name: context.session.user.name } : null,
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
