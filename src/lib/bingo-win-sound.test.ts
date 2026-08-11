import { beforeEach, describe, expect, test, vi } from 'vite-plus/test';

import { defaultWinnerSoundConfig } from './bingo-win-sound-config';

const metrics = vi.hoisted(() => ({ recordBingoSoundPlayed: vi.fn() }));

vi.mock('./observability/client-metrics', () => ({ ClientMetrics: metrics }));

import { playBingoWinSound, selectBingoWinSound } from './bingo-win-sound';

describe('bingo win sound selection', () => {
  test('selects sounds across the default relative-weight range', () => {
    expect(selectBingoWinSound(defaultWinnerSoundConfig, () => 0)?.id).toBe('congratulations-deep-voice');
    expect(selectBingoWinSound(defaultWinnerSoundConfig, () => 25 / 27)?.id).toBe('creaking-door');
    expect(selectBingoWinSound(defaultWinnerSoundConfig, () => 26 / 27)?.id).toBe('yeah-boy');
  });

  test('excludes disabled sounds and sounds with zero weight', () => {
    const config = structuredClone(defaultWinnerSoundConfig);
    for (const setting of Object.values(config.winnerSounds)) {
      setting.enabled = false;
    }
    config.winnerSounds['winner-game'] = { enabled: true, weight: 0 };
    config.winnerSounds['woo-reaction'] = { enabled: true, weight: 1 };

    expect(selectBingoWinSound(config, () => 0)?.id).toBe('woo-reaction');
  });

  test('returns no sound when the configuration disables all sounds', () => {
    const config = structuredClone(defaultWinnerSoundConfig);
    for (const setting of Object.values(config.winnerSounds)) {
      setting.enabled = false;
    }

    expect(selectBingoWinSound(config)).toBeNull();
  });
});

describe('bingo win sound playback', () => {
  beforeEach(() => vi.clearAllMocks());

  test('starts the selected sound once and records config version', async () => {
    const play = vi.fn(() => Promise.resolve());
    const createAudio = vi.fn(() => ({ play }));

    const sound = playBingoWinSound(defaultWinnerSoundConfig, createAudio, () => 0);
    await Promise.resolve();

    expect(sound?.id).toBe('congratulations-deep-voice');
    expect(createAudio).toHaveBeenCalledWith('/audio/winner-sounds/congratulations-deep-voice.mp3');
    expect(play).toHaveBeenCalledOnce();
    expect(metrics.recordBingoSoundPlayed).toHaveBeenCalledWith(
      'congratulations-deep-voice',
      defaultWinnerSoundConfig.version,
    );
  });

  test('does not throw or record when audio playback is unavailable', () => {
    expect(() =>
      playBingoWinSound(defaultWinnerSoundConfig, () => {
        throw new Error('Audio unavailable');
      }),
    ).not.toThrow();
    expect(metrics.recordBingoSoundPlayed).not.toHaveBeenCalled();
  });

  test('does not create audio when every sound is disabled', () => {
    const config = structuredClone(defaultWinnerSoundConfig);
    for (const setting of Object.values(config.winnerSounds)) {
      setting.enabled = false;
    }
    const createAudio = vi.fn();

    expect(playBingoWinSound(config, createAudio)).toBeNull();
    expect(createAudio).not.toHaveBeenCalled();
    expect(metrics.recordBingoSoundPlayed).not.toHaveBeenCalled();
  });

  test('handles autoplay rejection without recording playback', async () => {
    const rejection = Promise.reject(new Error('Autoplay denied'));

    playBingoWinSound(defaultWinnerSoundConfig, () => ({ play: () => rejection }));
    await rejection.catch(() => undefined);

    expect(metrics.recordBingoSoundPlayed).not.toHaveBeenCalled();
  });
});
