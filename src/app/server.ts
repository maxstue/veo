import * as Sentry from '@sentry/cloudflare';
import { wrapFetchWithSentry } from '@sentry/tanstackstart-react';
import handler from '@tanstack/react-start/server-entry';

export { GameSession } from '#/app/game-session/live/durable-object';
import { isGameSessionSocketRequest, proxyGameSessionSocket } from '#/app/game-session/live/socket.server';
import { sanitizeUrl } from '#/shared/lib/observability/privacy';

const applicationHandler = wrapFetchWithSentry({
  async fetch(request) {
    if (isGameSessionSocketRequest(request)) {
      return proxyGameSessionSocket(request);
    }
    return handler.fetch(request);
  },
});

export default Sentry.withSentry(
  (env: Env) => ({
    dsn: env.SENTRY_DSN,
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
