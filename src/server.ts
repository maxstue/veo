import * as Sentry from '@sentry/cloudflare';
import { wrapFetchWithSentry } from '@sentry/tanstackstart-react';
import handler from '@tanstack/react-start/server-entry';

import { sanitizeUrl } from '#/lib/observability/privacy';

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
    dataCollection: {
      userInfo: false,
      httpBodies: [],
    },
    enableLogs: true,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    tracesSampleRate: 0.05,
    beforeSend(event) {
      if (event.request?.url) {
        event.request.url = sanitizeUrl(event.request.url);
      }

      delete event.user;
      return event;
    },
  }),
  // @ts-expect-error -- TanStack Start's handler type differs from Cloudflare's handler type.
  wrapFetchWithSentry(handler),
);
