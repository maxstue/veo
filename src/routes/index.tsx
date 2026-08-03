import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, Eye, PencilLine, Sparkles, Users } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { AuthControls } from "#/components/auth-controls";

export const Route = createFileRoute("/")({ component: Home });

const bingoFields = [
  "Du bist stumm",
  "Könnt ihr mich sehen?",
  "Kurze Frage",
  "Ticket ist fast fertig",
  "Das parken wir",
  "FREE",
  "Nur ganz kurz",
  "Ich teile mal",
  "Wer übernimmt das?",
];

const features = [
  {
    icon: Users,
    title: "Ein Team, ein Pool",
    description: "Erstellt ein Team und ladet alle per Link zu eurem Bingo ein.",
  },
  {
    icon: PencilLine,
    title: "Gemeinsam gepflegt",
    description: "Jedes Mitglied kann Bingo-Begriffe hinzufügen und verbessern.",
  },
  {
    icon: Sparkles,
    title: "Jedes Meeting neu",
    description: "Veo mischt für jede Runde ein persönliches Bingo-Board.",
  },
];

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
      <header className="flex items-center justify-between rounded-4xl border bg-card/75 px-4 py-3 shadow-sm backdrop-blur sm:px-5">
        <a className="flex items-center gap-2 no-underline" href="/" aria-label="Veo Startseite">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
            <Eye className="size-5" aria-hidden="true" />
          </span>
          <span className="font-heading text-xl font-semibold tracking-tight">veo</span>
        </a>
        <div className="flex items-center gap-3">
          <Badge className="hidden sm:inline-flex" variant="secondary">
            Phase 3
          </Badge>
          <AuthControls />
        </div>
      </header>

      <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="max-w-2xl">
          <Badge className="mb-5" variant="outline">
            Bingo für bessere Meetings
          </Badge>
          <h1 className="text-5xl leading-[0.98] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
            Mehr Aufmerksamkeit. Weniger Meeting-Autopilot.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Erstellt euer eigenes Team-Bingo für Dailys, Reviews und alles dazwischen. Gemeinsam
            gepflegt, schnell gespielt und garantiert gesprächswürdig.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <a href="#so-funktionierts">
                Veo entdecken
                <ArrowRight data-icon="inline-end" aria-hidden="true" />
              </a>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#bingo-vorschau">Bingo ansehen</a>
            </Button>
          </div>
        </div>

        <Card
          id="bingo-vorschau"
          className="mx-auto w-full max-w-lg border-0 shadow-2xl shadow-primary/10"
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Daily Bingo</CardTitle>
                <CardDescription>Team Veo · persönliche Runde</CardDescription>
              </div>
              <Badge>3 / 9</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              {bingoFields.map((field, index) => {
                const selected = index === 1 || index === 5 || index === 7;

                return (
                  <div
                    className={`relative flex aspect-square items-center justify-center rounded-2xl border p-2 text-center text-xs leading-tight font-medium sm:text-sm ${
                      selected
                        ? "border-primary/25 bg-primary text-primary-foreground shadow-md shadow-primary/15"
                        : "bg-muted/55 text-foreground"
                    }`}
                    key={field}
                  >
                    {selected && (
                      <Check
                        className="absolute top-2 right-2 size-3.5 opacity-80"
                        aria-hidden="true"
                      />
                    )}
                    {field}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="so-funktionierts" className="grid scroll-mt-8 gap-4 pb-14 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card className="border-0 bg-card/75 shadow-sm backdrop-blur" key={title}>
            <CardHeader>
              <span className="mb-2 flex size-10 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <CardTitle>{title}</CardTitle>
              <CardDescription className="leading-6">{description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
