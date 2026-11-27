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
  const origin = 'https://veo.invalid';
  if (typeof value === 'string' && value.startsWith('/') && !value.startsWith('//') && URL.canParse(value, origin)) {
    const url = new URL(value, origin);
    if (url.origin === origin && !url.pathname.startsWith('//')) {
      return `${url.pathname}${url.search}${url.hash}`;
    }
  }
}
