import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEffect } from 'react';

import { completeRememberedSocialLogin } from '#/app/auth/last-login-method';
import { AuthHeader, AuthLayout, AuthPanel } from '#/app/auth/page';

export const Route = createFileRoute('/auth')({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.completeSignIn === 'string' ? { completeSignIn: search.completeSignIn } : {}),
    returnTo: safeReturnTo(search.returnTo),
  }),
  component: AuthRoute,
});

function AuthRoute() {
  const { completeSignIn, returnTo } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (completeSignIn && session) {
      completeRememberedSocialLogin(completeSignIn);
      void navigate({ href: returnTo ?? '/', replace: true });
    }
  }, [completeSignIn, navigate, returnTo, session]);

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
