import * as Sentry from '@sentry/cloudflare';

/** Names of the low-cardinality product counters emitted by Veo. */
type ProductMetricName =
  | 'veo.game.completed'
  | 'veo.game.started'
  | 'veo.team.created'
  | 'veo.user.deleted'
  | 'veo.user.registered';

/** Describes a product event sent as both a counter metric and a structured log. */
interface ProductEvent {
  /** Human-readable message shown in Sentry Logs. */
  message: string;
  /** Stable metric name used by Sentry dashboards and queries. */
  metric: ProductMetricName;
}

/**
 * Records privacy-safe product activity for Sentry dashboards.
 *
 * Metrics are emitted only after the corresponding database mutation succeeds. They intentionally contain no user,
 * team, card, or bingo-term identifiers.
 */
export const Metrics = {
  /** Records the first completed bingo for a card. */
  recordGameCompleted(): void {
    recordProductEvent({ metric: 'veo.game.completed', message: 'Bingo game completed' });
  },

  /** Records the successful creation of a new bingo card as a started game. */
  recordGameStarted(): void {
    recordProductEvent({ metric: 'veo.game.started', message: 'Bingo game started' });
  },

  /** Records the successful creation of a team. */
  recordTeamCreated(): void {
    recordProductEvent({ metric: 'veo.team.created', message: 'Team created' });
  },

  /** Records the successful permanent deletion of a user account. */
  recordUserDeleted(): void {
    recordProductEvent({ metric: 'veo.user.deleted', message: 'User account deleted' });
  },

  /** Records the successful registration of a new user account. */
  recordUserRegistered(): void {
    recordProductEvent({ metric: 'veo.user.registered', message: 'User registered' });
  },
} as const;

/**
 * Sends one domain event to Sentry as a counter and a structured informational log.
 *
 * @param event - Stable metric name and human-readable log message to emit.
 */
function recordProductEvent(event: ProductEvent) {
  if (!Sentry.isInitialized()) {
    return;
  }

  const attributes = { source: 'server' } as const;
  Sentry.metrics.count(event.metric, 1, { attributes });
  Sentry.logger.info(event.message, attributes);
}
