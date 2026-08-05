import * as Sentry from "@sentry/tanstackstart-react";
import { env } from "cloudflare:workers";

import { sanitizeUrl } from "#/lib/observability/privacy";

Sentry.init({
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
});
