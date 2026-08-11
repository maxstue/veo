import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const sentry = vi.hoisted(() => ({
  count: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  isInitialized: vi.fn(),
}));

vi.mock('@sentry/cloudflare', () => ({
  isInitialized: sentry.isInitialized,
  logger: { error: sentry.error, info: sentry.info },
  metrics: { count: sentry.count },
}));

import { Metrics } from './metrics';

describe('Metrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentry.isInitialized.mockReturnValue(true);
  });

  it.each([
    ['recordGameCompleted', 'veo.game.completed', 'Bingo game completed'],
    ['recordGameStarted', 'veo.game.started', 'Bingo game started'],
    ['recordPasswordResetEmailFailed', 'veo.password_reset.email.failed', 'Password reset email failed'],
    ['recordPasswordResetEmailSent', 'veo.password_reset.email.sent', 'Password reset email sent'],
    ['recordPasswordResetRequested', 'veo.password_reset.requested', 'Password reset requested'],
    ['recordTeamCreated', 'veo.team.created', 'Team created'],
    ['recordUserDeleted', 'veo.user.deleted', 'User account deleted'],
    ['recordUserRegistered', 'veo.user.registered', 'User registered'],
  ] as const)('emits %s as a privacy-safe counter and log', (method, metric, message) => {
    Metrics[method]();

    expect(sentry.count).toHaveBeenCalledWith(metric, 1, { attributes: { source: 'server' } });
    expect(sentry.info).toHaveBeenCalledWith(message, { source: 'server' });
  });

  it('does not emit metrics before Sentry is initialized', () => {
    sentry.isInitialized.mockReturnValue(false);

    Metrics.recordUserRegistered();

    expect(sentry.count).not.toHaveBeenCalled();
    expect(sentry.info).not.toHaveBeenCalled();
  });

  it('emits a structured error when the winner-sound configuration fails', () => {
    Metrics.recordWinnerSoundConfigFailed('invalid');

    const attributes = { reason: 'invalid', source: 'server' };
    expect(sentry.count).toHaveBeenCalledWith('veo.bingo_sound.config_failed', 1, { attributes });
    expect(sentry.error).toHaveBeenCalledWith('Winner sound configuration unavailable', attributes);
  });
});
