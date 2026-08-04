import { Link } from "@tanstack/react-router";
import { Eye } from "lucide-react";

import { AuthControls } from "./auth-controls";
import { Badge } from "./ui/badge";

export function AppHeader() {
  return (
    <header className="flex items-center justify-between rounded-4xl border bg-card/75 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
      <Link className="flex items-center gap-2 no-underline" to="/" aria-label="Veo Startseite">
        <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
          <Eye className="size-5" aria-hidden="true" />
        </span>
        <span className="font-heading text-xl font-semibold tracking-tight">veo</span>
      </Link>
      <div className="flex items-center gap-3">
        <Badge className="hidden sm:inline-flex" variant="secondary">
          Phase 4
        </Badge>
        <AuthControls />
      </div>
    </header>
  );
}
