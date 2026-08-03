import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { getAuth } from "#/lib/auth.server";

const handleAuthRequest = ({ request }: { request: Request }) => getAuth().handler(request);

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: handleAuthRequest,
      POST: handleAuthRequest,
    },
  },
});
