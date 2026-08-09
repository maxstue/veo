import * as Sentry from '@sentry/cloudflare';

/** Names of the low-cardinality product counters emitted by Veo. */
type ProductMetricName =
  | 'veo.game.completed'
  | 'veo.game.started'
  | 'veo.password_reset.email.failed'
  | 'veo.password_reset.email.sent'
  | 'veo.password_reset.requested'
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

  /** Records a password-reset email that Resend did not accept or deliver to its queue. */
  recordPasswordResetEmailFailed(): void {
    recordProductEvent({ metric: 'veo.password_reset.email.failed', message: 'Password reset email failed' });
  },

  /** Records a password-reset email accepted by Resend for delivery. */
  recordPasswordResetEmailSent(): void {
    recordProductEvent({ metric: 'veo.password_reset.email.sent', message: 'Password reset email sent' });
  },

  /** Records a valid user's password-reset request before delivery is scheduled. */
  recordPasswordResetRequested(): void {
    recordProductEvent({ metric: 'veo.password_reset.requested', message: 'Password reset requested' });
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
