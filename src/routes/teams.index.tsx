import { createFileRoute, Link, redirect, useNavigate, useRouter } from "@tanstack/react-router";
import { ArrowRight, LoaderCircle, Plus, Users } from "lucide-react";
import { type SubmitEvent, useState } from "react";

import { AppHeader } from "#/components/app-header";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { formatAppDate } from "#/lib/locale";
import { createTeam, getViewer, listTeams } from "#/lib/teams";

export const Route = createFileRoute("/teams/")({
  beforeLoad: async () => {
    if (!(await getViewer())) throw redirect({ to: "/auth", search: { returnTo: "/teams" } });
  },
  loader: () => listTeams(),
  component: TeamsPage,
});

function TeamsPage() {
  const teams = Route.useLoaderData();
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    const formValue = new FormData(event.currentTarget).get("name");
    const name = typeof formValue === "string" ? formValue : "";

    try {
      const result = await createTeam({ data: { name } });
      await router.invalidate();
      await navigate({ to: "/teams/$teamId", params: { teamId: result.teamId } });
    } catch {
      setError("The team could not be created. Check the name and try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10">
      <AppHeader />
      <section className="py-10 sm:py-14">
        <div className="mb-8">
          <p className="text-sm font-medium text-primary">Your Veo</p>
          <h1 className="mt-1 text-4xl font-semibold tracking-tight">Teams</h1>
          <p className="mt-2 text-muted-foreground">Choose a team or start a new bingo.</p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
          <div className="grid content-start gap-3">
            {teams.length ? (
              teams.map((item) => (
                <Link key={item.id} params={{ teamId: item.id }} to="/teams/$teamId">
                  <Card className="transition-colors hover:border-primary/40">
                    <CardContent className="flex items-center justify-between py-5">
                      <div className="flex items-center gap-3">
                        <span className="flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                          <Users className="size-5" aria-hidden="true" />
                        </span>
                        <div>
                          <p className="font-semibold">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Member since {formatAppDate(item.joinedAt)}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="size-5 text-muted-foreground" aria-hidden="true" />
                    </CardContent>
                  </Card>
                </Link>
              ))
            ) : (
              <Card className="border-dashed">
                <CardContent className="py-10 text-center text-muted-foreground">
                  You have not joined a team yet. Create your first one here.
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>New team</CardTitle>
              <CardDescription>You will automatically become the first member.</CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={submit}>
                <label className="grid gap-2 text-sm font-medium">
                  <span>Team name</span>
                  <input
                    className="h-11 rounded-2xl border bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    maxLength={80}
                    minLength={2}
                    name="name"
                    placeholder="Frontend Guild"
                    required
                  />
                </label>
                {error && (
                  <p className="text-sm text-destructive" role="alert">
                    {error}
                  </p>
                )}
                <Button className="w-full" disabled={isSubmitting} type="submit">
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Plus aria-hidden="true" />
                  )}
                  Create team
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
