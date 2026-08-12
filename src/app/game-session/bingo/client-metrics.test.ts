import { beforeEach, describe, expect, it, vi } from 'vite-plus/test';

const sentry = vi.hoisted(() => ({
  count: vi.fn(),
  info: vi.fn(),
  isInitialized: vi.fn(),
}));

vi.mock('@sentry/tanstackstart-react', () => ({
  isInitialized: sentry.isInitialized,
  logger: { info: sentry.info },
  metrics: { count: sentry.count },
}));

import { ClientMetrics } from './client-metrics';

describe('ClientMetrics', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sentry.isInitialized.mockReturnValue(true);
  });

  it('records the selected sound as a low-cardinality attribute', () => {
    ClientMetrics.recordBingoSoundPlayed('winner-game', '2026-08-11-1');

    const attributes = { configVersion: '2026-08-11-1', source: 'client', sound: 'winner-game' };
    expect(sentry.count).toHaveBeenCalledWith('veo.bingo_sound.played', 1, { attributes });
    expect(sentry.info).toHaveBeenCalledWith('Bingo win sound played', attributes);
  });

  it('does not emit metrics before Sentry is initialized', () => {
    sentry.isInitialized.mockReturnValue(false);

    ClientMetrics.recordBingoSoundPlayed('winner-game', '2026-08-11-1');

    expect(sentry.count).not.toHaveBeenCalled();
    expect(sentry.info).not.toHaveBeenCalled();
  });
});
