import { createFileRoute } from '@tanstack/react-router';

import { getAuth } from '#/app/auth/server';

const handleAuthRequest = ({ request }: { request: Request }) => getAuth().handler(request);

export const Route = createFileRoute('/api/auth/$')({
  server: {
    handlers: {
      GET: handleAuthRequest,
      POST: handleAuthRequest,
    },
  },
});
