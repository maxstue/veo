import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Copy, Link2, LoaderCircle, UserRound, Users, X } from "lucide-react";
import { useState } from "react";

import { AppHeader } from "#/components/app-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { createInvitation, getTeam, getViewer, revokeInvitation } from "#/lib/teams";

export const Route = createFileRoute("/teams/$teamId")({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer()))
      throw redirect({ to: "/auth", search: { returnTo: `/teams/${params.teamId}` } });
  },
  loader: ({ params }) => getTeam({ data: { teamId: params.teamId } }),
  component: TeamPage,
});

function TeamPage() {
  const data = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const router = useRouter();
  const [newLink, setNewLink] = useState<string>();
  const [isCreating, setIsCreating] = useState(false);

  async function invite() {
    setIsCreating(true);
    try {
      const invitation = await createInvitation({ data: { teamId } });
      setNewLink(`${window.location.origin}/invite/${invitation.token}`);
      await router.invalidate();
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10">
      <AppHeader />
      <section className="py-10 sm:py-14">
        <Button asChild className="mb-5" size="sm" variant="ghost">
          <Link to="/teams">
            <ArrowLeft aria-hidden="true" />
            Alle Teams
          </Link>
        </Button>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Team</p>
            <h1 className="mt-1 text-4xl font-semibold tracking-tight">{data.team.name}</h1>
            <p className="mt-2 text-muted-foreground">
              {data.members.length} {data.members.length === 1 ? "Mitglied" : "Mitglieder"}
            </p>
          </div>
          <Button disabled={isCreating} onClick={invite}>
            {isCreating ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Link2 aria-hidden="true" />
            )}
            Einladungslink erstellen
          </Button>
        </div>

        {newLink && (
          <Card className="mb-5 border-primary/25 bg-primary/5">
            <CardContent className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">Dieser Link wird nur einmal angezeigt</p>
                <p className="truncate text-sm text-muted-foreground">{newLink}</p>
              </div>
              <Button
                onClick={() => navigator.clipboard.writeText(newLink)}
                size="sm"
                variant="outline"
              >
                <Copy aria-hidden="true" />
                Kopieren
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-5 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="size-5" aria-hidden="true" />
                Mitglieder
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.members.map((member) => (
                <div
                  className="flex items-center gap-3 rounded-2xl bg-muted/55 p-3"
                  key={member.id}
                >
                  <span className="flex size-9 items-center justify-center rounded-xl bg-background">
                    <UserRound className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium">{member.name}</p>
                    <p className="truncate text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Einladungen</CardTitle>
              <CardDescription>Links sind sieben Tage und nur einmal gültig.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {data.invitations.length ? (
                data.invitations.map((invitation) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-2xl border p-3"
                    key={invitation.id}
                  >
                    <div>
                      <Badge variant={invitation.status === "active" ? "default" : "secondary"}>
                        {statusLabel[invitation.status]}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Erstellt {formatDate(invitation.createdAt)}
                      </p>
                    </div>
                    {invitation.status === "active" && (
                      <Button
                        aria-label="Einladung widerrufen"
                        onClick={async () => {
                          await revokeInvitation({ data: { teamId, invitationId: invitation.id } });
                          await router.invalidate();
                        }}
                        size="icon-sm"
                        variant="ghost"
                      >
                        <X aria-hidden="true" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="py-5 text-center text-sm text-muted-foreground">
                  Noch keine Einladungen.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}

const statusLabel = {
  active: "Aktiv",
  redeemed: "Eingelöst",
  revoked: "Widerrufen",
  expired: "Abgelaufen",
} as const;
function formatDate(value: Date) {
  return new Intl.DateTimeFormat("de-DE", { dateStyle: "medium" }).format(value);
}
