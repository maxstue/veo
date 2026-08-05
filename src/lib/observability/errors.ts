import * as Sentry from "@sentry/tanstackstart-react";

/**
 * Reports application errors to the configured observability backend.
 *
 * The facade keeps Sentry-specific calls out of UI components and provides a
 * stable application API if the backend or reporting policy changes later.
 */
export const Errors = {
  /**
   * Captures an error handled by TanStack Router's error component.
   *
   * A counter is emitted alongside the exception so dashboards can show the
   * total number of rendered route failures independently of Sentry issue grouping.
   * The operation is a no-op when Sentry has not been initialized.
   *
   * @param error - The error value supplied by TanStack Router.
   */
  captureRouteError(error: unknown): void {
    if (!Sentry.isInitialized()) {
      return;
    }

    Sentry.captureException(error, {
      tags: { source: "router-error-boundary" },
    });
    Sentry.metrics.count("veo.route_error", 1);
  },
} as const;
