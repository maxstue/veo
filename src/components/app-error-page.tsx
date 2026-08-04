import { Link, type ErrorComponentProps } from "@tanstack/react-router";
import { Eye, RotateCcw, TriangleAlert } from "lucide-react";

import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

export function AppErrorPage({ reset }: ErrorComponentProps) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <Card className="w-full max-w-lg border-0 text-center shadow-2xl shadow-primary/10">
        <CardHeader>
          <Link className="mx-auto mb-4 flex items-center gap-2 no-underline" to="/">
            <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Eye className="size-5" aria-hidden="true" />
            </span>
            <span className="font-heading text-xl font-semibold">veo</span>
          </Link>
          <span className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <TriangleAlert aria-hidden="true" />
          </span>
          <CardTitle>Veo konnte diese Seite nicht laden</CardTitle>
          <CardDescription>
            Bitte versuche es erneut. Falls der Fehler bestehen bleibt, kehre zur Startseite zurück.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={reset}>
            <RotateCcw aria-hidden="true" />
            Erneut versuchen
          </Button>
          <Button asChild variant="outline">
            <Link to="/">Zur Startseite</Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
