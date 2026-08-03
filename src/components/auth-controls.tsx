import { Link } from "@tanstack/react-router";
import { LogOut } from "lucide-react";

import { authClient } from "#/lib/auth-client";

import { Button } from "./ui/button";

export function AuthControls() {
  const { data: session, isPending, refetch } = authClient.useSession();

  if (isPending) {
    return <div className="h-9 w-24 animate-pulse rounded-2xl bg-muted" aria-label="Laden" />;
  }

  if (!session) {
    return (
      <Button asChild size="sm">
        <Link to="/auth">Anmelden</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-48 truncate text-sm text-muted-foreground sm:block">
        {session.user.name}
      </span>
      <Button
        aria-label="Abmelden"
        onClick={async () => {
          await authClient.signOut();
          await refetch();
        }}
        size="icon-sm"
        variant="outline"
      >
        <LogOut aria-hidden="true" />
      </Button>
    </div>
  );
}
