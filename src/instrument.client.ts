import * as Sentry from "@sentry/tanstackstart-react";

import { sanitizeUrl } from "#/lib/observability/privacy";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  dataCollection: {
    userInfo: false,
    httpBodies: [],
  },
  enableLogs: true,
  environment: import.meta.env.MODE,
  sendDefaultPii: false,
  tracesSampleRate: 0.05,
  integrations: [
    Sentry.feedbackIntegration({
      autoInject: true,
      colorScheme: "system",
      showBranding: false,
      buttonLabel: "Send feedback",
      submitButtonLabel: "Send feedback",
      formTitle: "Send feedback",
      messageLabel: "What happened?",
      messagePlaceholder: "Tell us what worked or what went wrong.",
      successMessageText: "Thank you for your feedback.",
    }),
  ],
  beforeSend(event) {
    if (event.request?.url) {
      event.request.url = sanitizeUrl(event.request.url);
    }

    delete event.user;
    return event;
  },
});
