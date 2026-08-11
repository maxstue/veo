import { describe, expect, test } from 'vite-plus/test';

import { defaultWinnerSoundConfig, parseWinnerSoundConfig } from './bingo-win-sound-config';

describe('winner sound configuration', () => {
  test('accepts a complete relative-weight configuration', () => {
    const config = structuredClone(defaultWinnerSoundConfig);
    config.version = '2026-08-11-1';
    config.winnerSounds['winner-game'].weight = 2;
    config.winnerSounds['yeah-boy'].enabled = false;

    expect(parseWinnerSoundConfig(config)).toEqual(config);
  });

  test.each([
    null,
    {},
    { version: 'invalid', winnerSounds: {} },
    {
      ...defaultWinnerSoundConfig,
      winnerSounds: {
        ...defaultWinnerSoundConfig.winnerSounds,
        'winner-game': { enabled: true, weight: -1 },
      },
    },
  ])('rejects an invalid configuration', (value) => {
    expect(parseWinnerSoundConfig(value)).toBeNull();
  });

  test('accepts a configuration that intentionally disables all sounds', () => {
    const config = structuredClone(defaultWinnerSoundConfig);
    for (const setting of Object.values(config.winnerSounds)) {
      setting.enabled = false;
    }

    expect(parseWinnerSoundConfig(config)).toEqual(config);
  });
});
