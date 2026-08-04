import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Check, PencilLine, Sparkles, Users } from "lucide-react";

import { Badge } from "#/components/ui/badge";
import { Button } from "#/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "#/components/ui/card";
import { AppHeader } from "#/components/app-header";

export const Route = createFileRoute("/")({ component: Home });

const bingoFields = [
  "You're on mute",
  "Can you see my screen?",
  "Quick question",
  "The ticket is almost done",
  "Let's park that",
  "FREE",
  "Just one quick thing",
  "Let me share my screen",
  "Who can take this?",
];

const features = [
  {
    icon: Users,
    title: "One team, one pool",
    description: "Create a team and invite everyone to your bingo with a link.",
  },
  {
    icon: PencilLine,
    title: "Built together",
    description: "Every member can add and improve bingo terms.",
  },
  {
    icon: Sparkles,
    title: "Fresh every meeting",
    description: "Veo shuffles a personal bingo board for every round.",
  },
];

function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
      <AppHeader />

      <section className="grid flex-1 items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="max-w-2xl">
          <Badge className="mb-5" variant="outline">
            Bingo for better meetings
          </Badge>
          <h1 className="text-5xl leading-[0.98] font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl">
            More attention. Less meeting autopilot.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Create your own team bingo for daily stand-ups, reviews, and everything in between.
            Built together, quick to play, and guaranteed to spark conversation.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button nativeButton={false} render={<a href="#how-it-works" />} size="lg">
              Discover Veo
              <ArrowRight data-icon="inline-end" aria-hidden="true" />
            </Button>
            <Button
              nativeButton={false}
              render={<a href="#bingo-preview" />}
              size="lg"
              variant="outline"
            >
              Preview bingo
            </Button>
          </div>
        </div>

        <Card
          id="bingo-preview"
          className="mx-auto w-full max-w-lg border-0 shadow-2xl shadow-primary/10"
        >
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Daily Bingo</CardTitle>
                <CardDescription>Team Veo · personal round</CardDescription>
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
                    className={`relative flex aspect-square items-center justify-center rounded-lg border p-2 text-center text-xs leading-tight font-medium sm:text-sm ${
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

      <section id="how-it-works" className="grid scroll-mt-8 gap-4 pb-14 md:grid-cols-3">
        {features.map(({ icon: Icon, title, description }) => (
          <Card className="border-0 bg-card/75 shadow-sm backdrop-blur" key={title}>
            <CardHeader>
              <span className="mb-2 flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
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
