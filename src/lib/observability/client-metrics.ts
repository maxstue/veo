import * as Sentry from '@sentry/tanstackstart-react';

import type { WinnerSoundId } from '../bingo-win-sound-config';

export const ClientMetrics = {
  recordBingoSoundPlayed(sound: WinnerSoundId, configVersion: string) {
    if (!Sentry.isInitialized()) {
      return;
    }

    const attributes = { configVersion, source: 'client', sound } as const;
    Sentry.metrics.count('veo.bingo_sound.played', 1, { attributes });
    Sentry.logger.info('Bingo win sound played', attributes);
  },
} as const;
