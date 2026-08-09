import { createFileRoute } from '@tanstack/react-router';
import { ArrowRight, Check, Link2, PencilLine, Play, Sparkles } from 'lucide-react';

import { AppHeader } from '#/components/app-header';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { VeoLogo } from '#/components/veo-logo';

export const Route = createFileRoute('/')({ component: Home });

const bingoFields = [
  "You're on mute",
  'Can you see my screen?',
  'Quick question',
  'The ticket is almost done',
  "Let's park that",
  'FREE',
  'Just one quick thing',
  'Let me share my screen',
  'Who can take this?',
];

const benefits = ['Schnell erstellt', 'Einfach geteilt', 'Gemeinsam gespielt'];

const steps = [
  {
    icon: PencilLine,
    number: '01',
    title: 'Bingo erstellen',
    description: 'Erstelle ein Team und sammelt gemeinsam Begriffe für eure nächste Runde.',
  },
  {
    icon: Link2,
    number: '02',
    title: 'Team einladen',
    description: 'Teile den Einladungslink – und schon können alle mitmachen.',
  },
  {
    icon: Play,
    number: '03',
    title: 'Gemeinsam spielen',
    description: 'Veo mischt für jede Person ein eigenes Board. Dann heißt es: aufmerksam bleiben.',
  },
];

function Home() {
  return (
    <main className='home-shell min-h-screen overflow-hidden'>
      <div className='mx-auto max-w-7xl px-5 pt-5 sm:px-8 lg:px-10'>
        <AppHeader />
      </div>

      <section className='relative mx-auto grid min-h-[calc(100svh-6rem)] max-w-7xl items-center gap-14 px-5 py-16 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-10 lg:py-24'>
        <div className='relative z-10 max-w-2xl'>
          <Badge
            className='border-primary/25 bg-primary/7 text-primary mb-6 rounded-full px-3 py-1 dark:text-violet-300'
            variant='outline'
          >
            <Sparkles className='size-3.5' aria-hidden='true' />
            Bingo für bessere Meetings
          </Badge>
          <h1 className='text-[clamp(3.25rem,7vw,5.6rem)] leading-[0.92] font-semibold tracking-[-0.055em] text-balance'>
            Gemeinsam spielen. <span className='text-primary'>Mehr erleben.</span>
          </h1>
          <p className='text-muted-foreground mt-7 max-w-xl text-lg leading-8 sm:text-xl'>
            Veo verwandelt eure Meetings in ein gemeinsames Bingo-Erlebnis – schnell erstellt, einfach geteilt und
            garantiert nicht langweilig.
          </p>
          <div className='mt-9 flex flex-wrap items-center gap-3'>
            <ButtonLink className='shadow-primary/20 h-12 rounded-xl px-6 text-base shadow-lg' to='/teams'>
              Kostenlos loslegen
              <ArrowRight data-icon='inline-end' aria-hidden='true' />
            </ButtonLink>
            <Button
              className='h-12 rounded-xl px-5 text-base'
              nativeButton={false}
              render={<a aria-label='how it works' href='#how-it-works' />}
              variant='ghost'
            >
              So funktioniert&apos;s
            </Button>
          </div>
          <ul className='mt-8 flex flex-wrap gap-x-6 gap-y-3' aria-label='Vorteile von Veo'>
            {benefits.map((benefit) => (
              <li className='text-muted-foreground flex items-center gap-2 text-sm font-medium' key={benefit}>
                <span className='bg-primary/10 text-primary flex size-5 items-center justify-center rounded-full'>
                  <Check className='size-3' strokeWidth={3} aria-hidden='true' />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        <div className='hero-preview relative mx-auto w-full max-w-xl lg:ml-auto'>
          <div className='bg-primary/8 absolute -inset-6 -z-10 rounded-[3rem] blur-2xl' />
          <Card className='bg-card/90 shadow-primary/10 ring-foreground/8 relative border-0 py-0 shadow-2xl ring-1 backdrop-blur'>
            <CardHeader className='border-border/70 border-b px-5 py-5 sm:px-7 sm:py-6'>
              <div className='flex items-center justify-between gap-4'>
                <div>
                  <CardTitle className='text-xl sm:text-2xl'>Daily Bingo</CardTitle>
                  <CardDescription className='mt-1'>Team Veo · persönliche Runde</CardDescription>
                </div>
                <Badge className='rounded-full px-3 py-1'>3 / 9</Badge>
              </div>
            </CardHeader>
            <CardContent className='p-4 sm:p-7'>
              <div className='grid grid-cols-3 gap-2 sm:gap-3'>
                {bingoFields.map((field, index) => {
                  const selected = index === 1 || index === 5 || index === 7;

                  return (
                    <div
                      className={`relative flex aspect-square items-center justify-center rounded-xl border p-2 text-center text-[0.7rem] leading-tight font-medium transition-transform sm:text-sm ${
                        selected
                          ? 'border-primary/20 bg-primary text-primary-foreground shadow-primary/20 shadow-md'
                          : 'border-border/70 bg-muted/55 text-foreground'
                      }`}
                      key={field}
                    >
                      {selected && <Check className='absolute top-2 right-2 size-3.5 opacity-80' aria-hidden='true' />}
                      {field}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
          <div className='bg-card absolute -right-3 -bottom-4 flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-lg sm:-right-6'>
            <span aria-hidden='true' className='relative flex size-2.5'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none' />
              <span className='relative inline-flex size-2.5 rounded-full bg-emerald-500' />
            </span>
            <span>Runde läuft</span>
          </div>
        </div>
      </section>

      <section id='how-it-works' className='scroll-mt-8'>
        <div className='mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10 lg:py-28'>
          <div className='mx-auto max-w-2xl text-center'>
            <p className='text-primary text-sm font-semibold tracking-[0.16em] uppercase'>So einfach geht&apos;s</p>
            <h2 className='mt-4 text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl'>
              Vom ersten Begriff bis zum Bingo.
            </h2>
            <p className='text-muted-foreground mt-5 text-lg leading-8'>
              Alles, was ihr für eure gemeinsame Runde braucht – ohne komplizierte Vorbereitung.
            </p>
          </div>
          <ol className='mt-14 grid gap-5 md:grid-cols-3'>
            {steps.map(({ icon: Icon, number, title, description }) => (
              <li
                className='group border-border/70 bg-background/75 hover:border-primary/25 hover:shadow-primary/5 rounded-2xl border p-6 transition-all hover:-translate-y-1 hover:shadow-xl motion-reduce:transform-none'
                key={number}
              >
                <div className='flex items-center justify-between'>
                  <span className='bg-primary/10 text-primary flex size-11 items-center justify-center rounded-xl'>
                    <Icon className='size-5' aria-hidden='true' />
                  </span>
                  <span className='font-heading text-muted-foreground/60 text-sm font-semibold'>{number}</span>
                </div>
                <h3 className='mt-8 text-xl font-semibold'>{title}</h3>
                <p className='text-muted-foreground mt-3 leading-7'>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className='mx-auto max-w-7xl px-5 py-16 sm:px-8 lg:px-10 lg:py-24'>
        <div className='border-border/70 bg-card/65 relative overflow-hidden rounded-3xl border px-6 py-14 text-center shadow-sm sm:px-12 sm:py-16'>
          <div className='bg-primary/10 absolute top-0 left-1/2 h-40 w-80 -translate-x-1/2 -translate-y-2/3 rounded-full blur-3xl' />
          <div className='relative mx-auto max-w-2xl'>
            <h2 className='text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl'>
              Bereit für aufmerksamere Meetings?
            </h2>
            <p className='text-muted-foreground mt-4 text-base leading-7 sm:text-lg'>
              Erstellt euer erstes Team-Bingo und macht aus bekannten Momenten ein gemeinsames Spiel.
            </p>
            <ButtonLink className='shadow-primary/10 mt-8 h-12 rounded-xl px-6 text-base shadow-md' to='/teams'>
              Erstes Bingo erstellen
              <ArrowRight data-icon='inline-end' aria-hidden='true' />
            </ButtonLink>
          </div>
        </div>
      </section>

      <footer className='border-border/60 border-t'>
        <div className='mx-auto flex max-w-7xl flex-col items-center justify-between gap-5 px-5 py-8 sm:flex-row sm:px-8 lg:px-10'>
          <VeoLogo markClassName='size-8' />
          <p className='text-muted-foreground text-center text-sm'>Bingo für bessere Meetings.</p>
        </div>
      </footer>
    </main>
  );
}
