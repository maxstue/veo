import { describe, expect, test } from 'vite-plus/test';

import { createToken, hashToken } from './invitations/tokens';

describe('team invitation tokens', () => {
  test('creates URL-safe tokens with enough entropy', () => {
    const first = createToken();
    const second = createToken();

    expect(first).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(second).not.toBe(first);
  });

  test('hashes tokens deterministically without storing the source token', async () => {
    const token = createToken();
    const hash = await hashToken(token);

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(await hashToken(token)).toBe(hash);
    expect(hash).not.toContain(token);
  });
});
