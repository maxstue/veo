import { createServerFn } from '@tanstack/react-start';

export const getAccount = createServerFn({ method: 'GET' }).handler(async () => {
  const implementation = await import('./account.server');
  return implementation.getAccount();
});
