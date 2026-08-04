import { Link } from "@tanstack/react-router";
import { Home } from "lucide-react";

import { AppHeader } from "./app-header";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

export function NotFoundPage() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10">
      <AppHeader />
      <section className="grid place-items-center py-20 sm:py-28">
        <Card className="w-full max-w-lg border-dashed text-center">
          <CardContent className="py-10">
            <p className="text-sm font-medium text-primary">404 · Not found</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">This page is gone.</h1>
            <p className="mx-auto mt-3 max-w-sm text-muted-foreground">
              The link may be outdated, or the address may have been entered incorrectly.
            </p>
            <Button asChild className="mt-6">
              <Link to="/">
                <Home aria-hidden="true" />
                Go to home page
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
