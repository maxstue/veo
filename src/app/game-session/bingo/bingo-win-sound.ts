import type { WinnerSoundConfig, WinnerSoundId } from './bingo-win-sound-config';
import { ClientMetrics } from './client-metrics';

type AudioPlayback = Pick<HTMLAudioElement, 'play'>;

export const bingoWinSounds: ReadonlyArray<{ id: WinnerSoundId; url: string }> = [
  {
    id: 'congratulations-deep-voice',
    url: '/audio/winner-sounds/congratulations-deep-voice.mp3',
  },
  { id: 'woo-reaction', url: '/audio/winner-sounds/woo-reaction.mp3' },
  { id: 'medieval-fanfare', url: '/audio/winner-sounds/medieval-fanfare.mp3' },
  { id: 'great-success', url: '/audio/winner-sounds/great-success.mp3' },
  { id: 'winner-game', url: '/audio/winner-sounds/winner-game.mp3' },
  { id: 'creaking-door', url: '/audio/winner-sounds/creaking-door.mp3' },
  { id: 'yeah-boy', url: '/audio/winner-sounds/yeah-boy.mp3' },
];

export type BingoWinSound = (typeof bingoWinSounds)[number];

export function selectBingoWinSound(config: WinnerSoundConfig, random: () => number = Math.random) {
  const enabledSounds = bingoWinSounds.filter(({ id }) => {
    const setting = config.winnerSounds[id];
    return setting.enabled && setting.weight > 0;
  });
  const totalWeight = enabledSounds.reduce((total, { id }) => total + config.winnerSounds[id].weight, 0);
  if (totalWeight === 0) {
    return null;
  }
  const target = random() * totalWeight;
  let cumulativeWeight = 0;

  for (const sound of enabledSounds) {
    cumulativeWeight += config.winnerSounds[sound.id].weight;
    if (target < cumulativeWeight) {
      return sound;
    }
  }

  return enabledSounds.at(-1)!;
}

export function playBingoWinSound(
  config: WinnerSoundConfig,
  createAudio: (url: string) => AudioPlayback = (url) => new Audio(url),
  random: () => number = Math.random,
) {
  const sound = selectBingoWinSound(config, random);
  if (!sound) {
    return null;
  }

  try {
    const playback = createAudio(sound.url).play();
    void playback.then(() => ClientMetrics.recordBingoSoundPlayed(sound.id, config.version)).catch(() => undefined);
  } catch {
    // Audio is optional and must never interrupt the game.
  }

  return sound;
}
