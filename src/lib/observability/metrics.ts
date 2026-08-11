import * as Sentry from '@sentry/cloudflare';

/** Names of the low-cardinality product counters emitted by Veo. */
type ProductMetricName =
  | 'veo.bingo_sound.config_failed'
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
  /** Records why the optional winner-sound configuration could not be used. */
  recordWinnerSoundConfigFailed(reason: WinnerSoundConfigFailureReason) {
    if (!Sentry.isInitialized()) {
      return;
    }

    const attributes = { reason, source: 'server' } as const;
    Sentry.metrics.count('veo.bingo_sound.config_failed', 1, { attributes });
    Sentry.logger.error('Winner sound configuration unavailable', attributes);
  },

  /** Records the first completed bingo for a card. */
  recordGameCompleted() {
    recordProductEvent({ metric: 'veo.game.completed', message: 'Bingo game completed' });
  },

  /** Records the successful creation of a new bingo card as a started game. */
  recordGameStarted() {
    recordProductEvent({ metric: 'veo.game.started', message: 'Bingo game started' });
  },

  /** Records a password-reset email that Resend did not accept or deliver to its queue. */
  recordPasswordResetEmailFailed() {
    recordProductEvent({ metric: 'veo.password_reset.email.failed', message: 'Password reset email failed' });
  },

  /** Records a password-reset email accepted by Resend for delivery. */
  recordPasswordResetEmailSent() {
    recordProductEvent({ metric: 'veo.password_reset.email.sent', message: 'Password reset email sent' });
  },

  /** Records a valid user's password-reset request before delivery is scheduled. */
  recordPasswordResetRequested() {
    recordProductEvent({ metric: 'veo.password_reset.requested', message: 'Password reset requested' });
  },

  /** Records the successful creation of a team. */
  recordTeamCreated() {
    recordProductEvent({ metric: 'veo.team.created', message: 'Team created' });
  },

  /** Records the successful permanent deletion of a user account. */
  recordUserDeleted() {
    recordProductEvent({ metric: 'veo.user.deleted', message: 'User account deleted' });
  },

  /** Records the successful registration of a new user account. */
  recordUserRegistered() {
    recordProductEvent({ metric: 'veo.user.registered', message: 'User registered' });
  },
} as const;

type WinnerSoundConfigFailureReason = 'binding-missing' | 'invalid' | 'key-missing' | 'unavailable';

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
