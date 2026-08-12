import { createRouter as createTanStackRouter } from '@tanstack/react-router';

import { createSentryClient } from '#/app/instrument-client';

import { routeTree } from '../routeTree.gen';

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
  });

  if (!router.isServer) {
    createSentryClient(router);
  }

  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
