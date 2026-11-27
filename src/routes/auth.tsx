import { createFileRoute } from '@tanstack/react-router';

import { AuthHeader, AuthLayout, AuthPanel } from '#/app/auth/page';

export const Route = createFileRoute('/auth')({
  // `error` is optional so links to /auth only need `returnTo`; better-auth adds it after a failed social sign-in.
  validateSearch: (search: Record<string, unknown>): { error?: string; returnTo: string | undefined } => ({
    error: typeof search.error === 'string' ? search.error : undefined,
    returnTo: safeReturnTo(search.returnTo),
  }),
  component: AuthRoute,
});

function AuthRoute() {
  const { error, returnTo } = Route.useSearch();
  return (
    <AuthLayout>
      <AuthHeader />
      <AuthPanel oauthError={error} returnTo={returnTo} />
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
