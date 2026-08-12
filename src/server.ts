import * as Sentry from '@sentry/cloudflare';
import { wrapFetchWithSentry } from '@sentry/tanstackstart-react';
import handler from '@tanstack/react-start/server-entry';

import { GameSession } from '#/lib/game-session-durable-object';
import { isGameSessionSocketRequest, proxyGameSessionSocket } from '#/lib/game-session-websocket.server';
import { sanitizeUrl } from '#/lib/observability/privacy';

const applicationHandler = wrapFetchWithSentry({
  async fetch(request) {
    if (isGameSessionSocketRequest(request)) {
      return proxyGameSessionSocket(request);
    }
    return handler.fetch(request);
  },
});

export { GameSession };

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
  applicationHandler,
);
