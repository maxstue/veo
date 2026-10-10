import { describe, expect, test, vi } from 'vite-plus/test';

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({
    handler: vi.fn(),
    validator: (validate: (input: unknown) => unknown) => ({ handler: () => ({ validate }) }),
  }),
}));

import { createInvitation } from './api';

const invitation = createInvitation as unknown as {
  validate: (input: unknown) => { email: string; teamId: string };
};

describe('invitation email validation', () => {
  test.each([
    [' Ada+team@Example.TEST ', 'ada+team@example.test'],
    ['user@sub.example.test', 'user@sub.example.test'],
    ['first.last@example.test', 'first.last@example.test'],
    ['a@b.c', 'a@b.c'],
    ['a@b..', 'a@b..'],
    ['a@..b', 'a@..b'],
  ])('preserves the accepted address %s', (email, expected) => {
    expect(invitation.validate({ teamId: 'team-1', email })).toEqual({ teamId: 'team-1', email: expected });
  });

  test.each([
    'user.example.test',
    '@example.test',
    'user@',
    'user@example',
    'user@.test',
    'user@example.',
    'user@@example.test',
    'user name@example.test',
    'user@example .test',
    'user\tname@example.test',
    `user@${'.'.repeat(250)}`,
  ])('rejects the malformed or oversized address %s', (email) => {
    expect(() => invitation.validate({ teamId: 'team-1', email })).toThrow('Invalid email');
  });
});
