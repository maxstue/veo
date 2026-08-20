import { createServerFn } from '@tanstack/react-start';

export const getSession = createServerFn({ method: 'GET' }).handler(async () => {
  const implementation = await import('./guards.server');
  return implementation.getSession();
});
