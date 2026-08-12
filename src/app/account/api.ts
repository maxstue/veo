import { createServerFn } from '@tanstack/react-start';

export const getAccount = createServerFn({ method: 'GET' }).handler(async () => {
  const implementation = await import('./server');
  return implementation.getAccount();
});
