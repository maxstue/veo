import { createFileRoute } from '@tanstack/react-router';

import { ResetPasswordCard, ResetPasswordLayout } from '#/app/invitations/reset-password-page';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === 'string' ? search.error : undefined,
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordRoute,
});

function ResetPasswordRoute() {
  const { error, token } = Route.useSearch();
  return (
    <ResetPasswordLayout>
      <ResetPasswordCard linkError={error} token={token} />
    </ResetPasswordLayout>
  );
}
