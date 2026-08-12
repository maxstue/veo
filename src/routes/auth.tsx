import { createFileRoute } from '@tanstack/react-router';

import { AuthHeader, AuthLayout, AuthPanel } from '#/app/auth/page';

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: safeReturnTo(search.returnTo),
  }),
  component: AuthRoute,
});

function AuthRoute() {
  const { returnTo } = Route.useSearch();
  return (
    <AuthLayout>
      <AuthHeader />
      <AuthPanel returnTo={returnTo} />
    </AuthLayout>
  );
}

function safeReturnTo(value: unknown) {
  return typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') ? value : undefined;
}
