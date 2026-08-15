import { createServerFn } from '@tanstack/react-start';

export const getActiveGameCount = createServerFn({ method: 'GET' }).handler(async () => {
  const implementation = await import('./home.server');
  return implementation.getActiveGameCount();
});
