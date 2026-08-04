import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  Copy,
  Link2,
  LoaderCircle,
  Pencil,
  Plus,
  Trash2,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { type SubmitEvent, useState } from "react";

import { AppHeader } from "#/components/app-header";
import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { createBingoTerm, deleteBingoTerm, updateBingoTerm } from "#/lib/bingo-terms";
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

        <TermLibrary teamId={teamId} terms={data.terms} />

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

type TeamTerm = { id: string; label: string; updatedAt: Date };

function TermLibrary({ teamId, terms }: { teamId: string; terms: TeamTerm[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string>();
  const [editingLabel, setEditingLabel] = useState("");
  const [pendingId, setPendingId] = useState<string>();
  const [error, setError] = useState<string>();
  const missingTerms = Math.max(0, 25 - terms.length);

  async function add(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setPendingId("new");
    const form = event.currentTarget;
    const value = new FormData(form).get("label");

    try {
      const result = await createBingoTerm({
        data: { teamId, label: typeof value === "string" ? value : "" },
      });
      if (result.status === "duplicate") {
        setError("Dieser Begriff ist im Team bereits vorhanden.");
        return;
      }
      form.reset();
      await router.invalidate();
    } catch {
      setError("Der Begriff ist leer, zu lang oder konnte nicht gespeichert werden.");
    } finally {
      setPendingId(undefined);
    }
  }

  async function save(termId: string) {
    setError(undefined);
    setPendingId(termId);
    try {
      const result = await updateBingoTerm({ data: { teamId, termId, label: editingLabel } });
      if (result.status === "duplicate") {
        setError("Dieser Begriff ist im Team bereits vorhanden.");
        return;
      }
      if (result.status === "not-found") {
        setError("Der Begriff existiert nicht mehr.");
        return;
      }
      setEditingId(undefined);
      await router.invalidate();
    } catch {
      setError("Der Begriff ist leer, zu lang oder konnte nicht gespeichert werden.");
    } finally {
      setPendingId(undefined);
    }
  }

  async function remove(term: TeamTerm) {
    if (!window.confirm(`„${term.label}“ wirklich löschen?`)) return;
    setError(undefined);
    setPendingId(term.id);
    try {
      const result = await deleteBingoTerm({ data: { teamId, termId: term.id } });
      if (result.status === "not-found") setError("Der Begriff existiert nicht mehr.");
      await router.invalidate();
    } catch {
      setError("Der Begriff konnte nicht gelöscht werden.");
    } finally {
      setPendingId(undefined);
    }
  }

  return (
    <Card className="mb-5">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span>Bingo-Begriffe</span>
          <Badge variant={missingTerms ? "secondary" : "default"}>{terms.length} / 25</Badge>
        </CardTitle>
        <CardDescription>
          {missingTerms
            ? `Noch ${missingTerms} ${missingTerms === 1 ? "Begriff" : "Begriffe"}, bevor ihr eine 5×5-Karte starten könnt.`
            : "Genug Begriffe für eine 5×5-Karte. Ihr könnt jederzeit weitere ergänzen."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={add}>
          <label className="sr-only" htmlFor="new-term">
            Neuer Bingo-Begriff
          </label>
          <input
            className="h-10 min-w-0 flex-1 rounded-2xl border bg-background px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
            disabled={pendingId === "new"}
            id="new-term"
            maxLength={80}
            name="label"
            placeholder="Zum Beispiel: Du bist noch auf stumm"
            required
          />
          <Button disabled={pendingId === "new"} type="submit">
            {pendingId === "new" ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            Hinzufügen
          </Button>
        </form>

        {error && (
          <p
            className="mt-3 rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        )}

        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {terms.length ? (
            terms.map((term) => (
              <div className="flex min-w-0 items-center gap-2 rounded-2xl border p-2" key={term.id}>
                {editingId === term.id ? (
                  <input
                    aria-label="Bingo-Begriff bearbeiten"
                    autoFocus
                    className="h-8 min-w-0 flex-1 rounded-xl border bg-background px-2 outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
                    maxLength={80}
                    onChange={(event) => setEditingLabel(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") void save(term.id);
                      if (event.key === "Escape") setEditingId(undefined);
                    }}
                    value={editingLabel}
                  />
                ) : (
                  <span className="min-w-0 flex-1 truncate px-1 font-medium" title={term.label}>
                    {term.label}
                  </span>
                )}
                {editingId === term.id ? (
                  <>
                    <Button
                      aria-label="Änderung speichern"
                      disabled={pendingId === term.id}
                      onClick={() => void save(term.id)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      {pendingId === term.id ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <Check />
                      )}
                    </Button>
                    <Button
                      aria-label="Bearbeitung abbrechen"
                      onClick={() => setEditingId(undefined)}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <X />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      aria-label={`„${term.label}“ bearbeiten`}
                      onClick={() => {
                        setEditingId(term.id);
                        setEditingLabel(term.label);
                        setError(undefined);
                      }}
                      size="icon-sm"
                      type="button"
                      variant="ghost"
                    >
                      <Pencil />
                    </Button>
                    <Button
                      aria-label={`„${term.label}“ löschen`}
                      disabled={pendingId === term.id}
                      onClick={() => void remove(term)}
                      size="icon-sm"
                      type="button"
                      variant="destructive"
                    >
                      {pendingId === term.id ? (
                        <LoaderCircle className="animate-spin" />
                      ) : (
                        <Trash2 />
                      )}
                    </Button>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="col-span-full py-5 text-center text-sm text-muted-foreground">
              Noch keine Begriffe. Fügt gemeinsam euren ersten Meeting-Klassiker hinzu.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
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
