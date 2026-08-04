import { createFileRoute, Link, redirect, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Dices, LoaderCircle, RotateCcw, Trophy } from "lucide-react";
import { type CSSProperties, useState } from "react";

import { Button } from "#/components/ui/button";
import { createBingoCard, getBingoGame, resetBingoCard, toggleBingoCell } from "#/lib/bingo-cards";
import { getTeam, getViewer } from "#/lib/teams";

export const Route = createFileRoute("/teams/$teamId_/play")({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer()))
      throw redirect({ to: "/auth", search: { returnTo: `/teams/${params.teamId}/play` } });
  },
  loader: async ({ params }) => {
    const [teamData, game] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      getBingoGame({ data: { teamId: params.teamId } }),
    ]);
    return { team: teamData.team, termCount: teamData.terms.length, game };
  },
  onLeave: (match) => {
    const cardId = match.loaderData?.game.card?.id;
    if (!cardId) return;

    void resetBingoCard({ data: { teamId: match.params.teamId, cardId } }).catch(() => undefined);
  },
  component: BingoPage,
});

function BingoPage() {
  const { game, team, termCount } = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const router = useRouter();
  const [pending, setPending] = useState<string>();
  const [error, setError] = useState<string>();
  const [celebration, setCelebration] = useState(0);
  const card = game.card;
  const isTogglingCell = pending?.startsWith("cell-") ?? false;

  async function createCard() {
    if (card && !window.confirm("Eine neue Karte erstellen und die aktuelle Karte ersetzen?")) {
      return;
    }
    setError(undefined);
    setPending("create");
    try {
      const result = await createBingoCard({ data: { teamId } });
      if (result.status === "insufficient-terms") {
        setError(`Für eine Karte fehlen noch ${25 - result.available} Bingo-Begriffe.`);
        return;
      }
      await router.invalidate();
    } catch {
      setError("Die Karte konnte nicht erstellt werden.");
    } finally {
      setPending(undefined);
    }
  }

  async function toggle(cardId: string, position: number) {
    setError(undefined);
    setPending(`cell-${position}`);
    try {
      const result = await toggleBingoCell({ data: { teamId, cardId, position } });
      if (result.bingo && !card?.bingo) setCelebration((value) => value + 1);
      await router.invalidate();
    } catch {
      setError("Die Markierung konnte nicht gespeichert werden.");
    } finally {
      setPending(undefined);
    }
  }

  async function reset(cardId: string) {
    if (!window.confirm("Alle Markierungen auf dieser Karte zurücksetzen?")) return;
    setError(undefined);
    setPending("reset");
    try {
      await resetBingoCard({ data: { teamId, cardId } });
      await router.invalidate();
    } catch {
      setError("Die Markierungen konnten nicht zurückgesetzt werden.");
    } finally {
      setPending(undefined);
    }
  }

  return (
    <main className="mx-auto grid h-dvh max-w-5xl grid-rows-[auto_minmax(0,1fr)] gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-5">
      {celebration > 0 && <Confetti key={celebration} />}

      <header>
        <Button asChild size="sm" variant="ghost">
          <Link params={{ teamId }} to="/teams/$teamId">
            <ArrowLeft aria-hidden="true" />
            Zurück
          </Link>
        </Button>
      </header>

      <section className="grid min-h-0 grid-rows-[auto_minmax(0,1fr)] justify-items-center gap-3">
        <div className="flex w-full max-w-4xl flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-primary">{team.name}</p>
            <h1 className="mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl">
              {card?.bingo ? (
                <Trophy className="size-8 text-primary" />
              ) : (
                <Dices className="size-8" />
              )}
              {card?.bingo ? "Bingo!" : "Deine Bingo-Karte"}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {card
                ? "Tippe auf ein Feld, sobald du den Begriff hörst. Alles wird automatisch gespeichert."
                : termCount >= 25
                  ? "Mische deine persönliche 5×5-Karte und starte das Spiel."
                  : `Noch ${25 - termCount} ${25 - termCount === 1 ? "Begriff" : "Begriffe"}, bevor ihr spielen könnt.`}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {card && (
              <Button
                className={isTogglingCell ? "disabled:opacity-100" : undefined}
                disabled={Boolean(pending)}
                onClick={() => void reset(card.id)}
                size="sm"
                variant="outline"
              >
                <RotateCcw aria-hidden="true" />
                Zurücksetzen
              </Button>
            )}
            <Button
              className={isTogglingCell ? "disabled:opacity-100" : undefined}
              disabled={Boolean(pending) || termCount < 25}
              onClick={() => void createCard()}
              size="sm"
            >
              {pending === "create" ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <Dices aria-hidden="true" />
              )}
              {card ? "Neu mischen" : "Karte mischen"}
            </Button>
          </div>
        </div>

        <div className="flex min-h-0 w-full items-center justify-center">
          {card ? (
            <div
              aria-label="Bingo-Karte"
              className={`grid aspect-square h-full max-h-full w-auto max-w-full flex-none grid-cols-5 gap-1.5 rounded-3xl border bg-card/80 p-2 shadow-xl backdrop-blur sm:gap-3 sm:p-4 ${
                card.bingo ? "border-primary shadow-primary/15" : ""
              }`}
              role="group"
            >
              {card.cells.map((cell) => {
                const marked = Boolean(cell.markedAt);
                const isPending = pending === `cell-${cell.position}`;
                return (
                  <button
                    aria-label={`${cell.labelSnapshot}${marked ? ", markiert" : ", nicht markiert"}`}
                    aria-pressed={marked}
                    className={`aspect-square min-w-0 rounded-xl border p-1 text-[0.62rem] font-medium leading-tight transition duration-200 sm:rounded-2xl sm:p-3 sm:text-sm lg:text-base ${
                      marked
                        ? "scale-[0.97] border-primary bg-primary text-primary-foreground shadow-md"
                        : "bg-background hover:-translate-y-0.5 hover:border-primary/50 hover:bg-primary/5"
                    } ${isPending ? "opacity-60" : ""}`}
                    disabled={Boolean(pending)}
                    key={cell.position}
                    onClick={() => void toggle(card.id, cell.position)}
                    type="button"
                  >
                    <span className="line-clamp-4">{cell.labelSnapshot}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex h-full max-h-96 w-full max-w-4xl flex-col items-center justify-center rounded-3xl border border-dashed bg-card/70 p-6 text-center">
              <span className="mb-3 flex size-14 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <Dices className="size-7" aria-hidden="true" />
              </span>
              <h2 className="text-xl font-semibold">Bereit für dein Bingo?</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Deine Karte wird einmalig aus den Begriffen des Teams gemischt und bleibt danach
                stabil.
              </p>
            </div>
          )}
        </div>
      </section>

      {error && (
        <div className="pointer-events-none fixed inset-x-0 bottom-4 z-40 flex justify-center px-3 sm:bottom-6">
          <p
            className="animate-in fade-in slide-in-from-bottom-4 rounded-2xl border border-destructive/20 bg-background px-4 py-2 text-sm text-destructive shadow-xl duration-300"
            role="alert"
          >
            {error}
          </p>
        </div>
      )}
    </main>
  );
}

const confettiColors = ["#7c3aed", "#ec4899", "#f59e0b", "#10b981", "#3b82f6"];

function Confetti() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 70 }, (_, index) => {
        const style = {
          "--confetti-color": confettiColors[index % confettiColors.length],
          "--confetti-delay": `${(index % 14) * 0.035}s`,
          "--confetti-drift": `${((index * 53) % 41) - 20}vw`,
          "--confetti-duration": `${2.6 + (index % 7) * 0.18}s`,
          "--confetti-left": `${(index * 37) % 100}%`,
          "--confetti-spin": `${360 + (index % 5) * 180}deg`,
        } as CSSProperties;

        return <i className="veo-confetti" key={index} style={style} />;
      })}
    </div>
  );
}
