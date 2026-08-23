import { describe, expect, test } from 'vite-plus/test';

import { getAuthMethods, socialAuthProviders } from './methods';

describe('authentication methods', () => {
  test('labels Better Auth credentials clearly', () => {
    expect(getAuthMethods(['credential'])).toEqual([{ providerId: 'credential', label: 'Email & password' }]);
  });

  test('deduplicates providers and handles unsupported providers safely', () => {
    expect(getAuthMethods(['google', 'google', 'new-provider'])).toEqual([
      { providerId: 'google', label: 'Google' },
      { providerId: 'new-provider', label: 'Other sign-in method' },
    ]);
  });

  test('exposes the enabled social providers as UI configuration', () => {
    expect(socialAuthProviders).toEqual([
      { providerId: 'google', label: 'Google' },
      { providerId: 'microsoft', label: 'Microsoft' },
    ]);
  });
});
