import { createFileRoute, Link, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Eye, LoaderCircle, LockKeyhole } from "lucide-react";
import { type InputHTMLAttributes, type SubmitEvent, useState } from "react";

import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { authClient } from "#/lib/auth-client";

export const Route = createFileRoute("/auth")({
  validateSearch: (search: Record<string, unknown>) => ({
    returnTo: safeReturnTo(search.returnTo),
  }),
  component: AuthPage,
});

type AuthMode = "sign-in" | "sign-up";

function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("sign-in");
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const router = useRouter();
  const { returnTo } = Route.useSearch();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = getFormString(form, "email").trim();
    const password = getFormString(form, "password");
    const name = getFormString(form, "name").trim();

    const result =
      mode === "sign-up"
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message || "Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
      setIsSubmitting(false);
      return;
    }

    await router.invalidate();
    await navigate({ href: returnTo ?? "/" });
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between">
        <Link className="flex items-center gap-2 no-underline" to="/" aria-label="Veo Startseite">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Eye className="size-5" aria-hidden="true" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">veo</span>
        </Link>
        <Button asChild size="sm" variant="ghost">
          <Link to="/">
            <ArrowLeft aria-hidden="true" />
            Zurück
          </Link>
        </Button>
      </header>

      <section className="grid flex-1 place-items-center py-12">
        <Card className="w-full max-w-md border-0 shadow-2xl shadow-primary/10">
          <CardHeader className="text-center">
            <span className="mx-auto mb-2 flex size-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <LockKeyhole className="size-5" aria-hidden="true" />
            </span>
            <CardTitle className="text-2xl">
              {mode === "sign-in" ? "Willkommen zurück" : "Veo-Konto erstellen"}
            </CardTitle>
            <CardDescription>
              {mode === "sign-in"
                ? "Melde dich an, um mit deinem Team Bingo zu spielen."
                : "Ein Konto genügt für alle deine Veo-Teams."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-6 grid grid-cols-2 rounded-2xl bg-muted p-1">
              <Button
                onClick={() => {
                  setMode("sign-in");
                  setError(undefined);
                }}
                type="button"
                variant={mode === "sign-in" ? "secondary" : "ghost"}
              >
                Anmelden
              </Button>
              <Button
                onClick={() => {
                  setMode("sign-up");
                  setError(undefined);
                }}
                type="button"
                variant={mode === "sign-up" ? "secondary" : "ghost"}
              >
                Registrieren
              </Button>
            </div>

            <form className="space-y-4" onSubmit={submit}>
              {mode === "sign-up" && (
                <Field label="Name" name="name" autoComplete="name" placeholder="Dein Name" />
              )}
              <Field
                label="E-Mail"
                name="email"
                autoComplete="email"
                placeholder="du@beispiel.de"
                type="email"
              />
              <Field
                label="Passwort"
                name="password"
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                minLength={8}
                placeholder="Mindestens 8 Zeichen"
                type="password"
              />

              {error && (
                <p
                  className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}

              <Button className="w-full" disabled={isSubmitting} size="lg" type="submit">
                {isSubmitting && <LoaderCircle className="animate-spin" aria-hidden="true" />}
                {mode === "sign-in" ? "Anmelden" : "Konto erstellen"}
              </Button>
            </form>

            <p className="mt-5 text-center text-xs leading-5 text-muted-foreground">
              E-Mail-Verifikation und Passwort-Reset folgen nach dem MVP. Verwende vorerst eine
              erreichbare Adresse und bewahre dein Passwort sicher auf.
            </p>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}

function safeReturnTo(value: unknown) {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    ? value
    : undefined;
}

function getFormString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value : "";
}

function Field({
  label,
  name,
  ...inputProps
}: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="grid gap-2 text-sm font-medium">
      {label}
      <input
        className="h-11 rounded-2xl border bg-background px-3 text-base outline-none transition-shadow placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
        name={name}
        required
        {...inputProps}
      />
    </label>
  );
}
