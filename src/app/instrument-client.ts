import * as Sentry from '@sentry/tanstackstart-react';

import { sanitizeUrl } from '#/shared/lib/observability/privacy';

type TanStackRouter = Parameters<typeof Sentry.tanstackRouterBrowserTracingIntegration>[0];

/**
 * Initializes browser-side Sentry after TanStack Router has been created.
 *
 * Keeping the complete client configuration here ensures the router tracing integration is registered during
 * initialization. Repeated calls are ignored to avoid creating multiple clients during development or hot reloads.
 *
 * @param router - Browser router used to instrument TanStack navigations.
 */
export function createSentryClient(router: TanStackRouter) {
  if (Sentry.isInitialized()) {
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: {
        request: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
        response: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
      },
      httpBodies: [],
      urlQueryParams: { deny: ['forwarded', '-ip', 'remote-', 'via', '-user'] },
      genAI: { inputs: false, outputs: false },
      databaseQueryData: false,
      graphQL: { document: false, variables: false },
    },
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.05,
    integrations: [Sentry.tanstackRouterBrowserTracingIntegration(router)],
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url);
      }

      delete event.user;
      return event;
    },
  });
}
