import { describe, expect, test } from 'vite-plus/test';

import { getAuthMethods } from './methods';

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
});
