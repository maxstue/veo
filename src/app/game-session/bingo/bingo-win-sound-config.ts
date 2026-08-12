export const winnerSoundIds = [
  'congratulations-deep-voice',
  'woo-reaction',
  'medieval-fanfare',
  'great-success',
  'winner-game',
  'creaking-door',
  'yeah-boy',
] as const;

export type WinnerSoundId = (typeof winnerSoundIds)[number];
export type WinnerSoundSetting = { enabled: boolean; weight: number };
export type WinnerSoundConfig = {
  version: string;
  winnerSounds: Record<WinnerSoundId, WinnerSoundSetting>;
};

export const defaultWinnerSoundConfig: WinnerSoundConfig = {
  version: 'default-1',
  winnerSounds: {
    'congratulations-deep-voice': { enabled: true, weight: 5 },
    'woo-reaction': { enabled: true, weight: 5 },
    'medieval-fanfare': { enabled: true, weight: 5 },
    'great-success': { enabled: true, weight: 5 },
    'winner-game': { enabled: true, weight: 5 },
    'creaking-door': { enabled: true, weight: 1 },
    'yeah-boy': { enabled: true, weight: 1 },
  },
};

export function parseWinnerSoundConfig(value: unknown) {
  if (!isRecord(value) || typeof value.version !== 'string' || !value.version || value.version.length > 100) {
    return null;
  }
  if (!isRecord(value.winnerSounds)) {
    return null;
  }

  const winnerSounds = {} as WinnerSoundConfig['winnerSounds'];
  for (const id of winnerSoundIds) {
    const setting = value.winnerSounds[id];
    if (
      !isRecord(setting) ||
      typeof setting.enabled !== 'boolean' ||
      typeof setting.weight !== 'number' ||
      !Number.isInteger(setting.weight) ||
      setting.weight < 0 ||
      setting.weight > 1000
    ) {
      return null;
    }
    winnerSounds[id] = { enabled: setting.enabled, weight: setting.weight };
  }

  return { version: value.version, winnerSounds };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
