import { ArrowRight, Check, Link2, PencilLine, Play, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';

import { getActiveGameCount } from '#/app/home/api';
import { AppHeader } from '#/app/shell/app-header';
import { VeoLogo } from '#/app/shell/veo-logo';
import { Badge } from '#/shared/ui/badge';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { HomeContainer } from './home-container';

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
const benefits = ['Play together online', 'Set up in minutes', 'Share with a link'];
const steps = [
  {
    icon: PencilLine,
    number: '01',
    title: 'Create a bingo',
    description: 'Create a group and add the moments that make your next game memorable.',
  },
  {
    icon: Link2,
    number: '02',
    title: 'Invite your group',
    description: 'Share the invitation link and everyone can join online.',
  },
  {
    icon: Play,
    number: '03',
    title: 'Play together',
    description: 'Veo shuffles a unique board for every player. Then keep an eye out.',
  },
];

function HomeHeader() {
  return (
    <HomeContainer className='pt-5'>
      <AppHeader />
    </HomeContainer>
  );
}

function HomeHero() {
  return (
    <section>
      <HomeContainer className='relative grid min-h-[calc(100svh-6rem)] items-center gap-14 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24'>
        <div className='relative z-10 max-w-2xl'>
          <Badge
            className='border-primary/25 bg-primary/7 text-primary mb-6 rounded-full px-3 py-1 dark:text-violet-300'
            variant='outline'
          >
            <Sparkles className='size-3.5' aria-hidden='true' /> Online bingo for groups
          </Badge>
          <h1 className='text-[clamp(3.25rem,7vw,5.6rem)] leading-[0.92] font-semibold tracking-[-0.055em] text-balance'>
            Play together, <span className='text-primary'>wherever you are.</span>
          </h1>
          <p className='text-muted-foreground mt-7 max-w-xl text-lg leading-8 sm:text-xl'>
            Veo is online bingo for teams, friends, and communities. Set up a game in minutes, share one link, and play
            together from anywhere — for meetings, game nights, and everything in between.
          </p>
          <div className='mt-9 flex flex-wrap items-center gap-3'>
            <ButtonLink className='shadow-primary/20 h-12 rounded-xl px-6 text-base shadow-lg' to='/teams'>
              Start for free <ArrowRight data-icon='inline-end' aria-hidden='true' />
            </ButtonLink>
            <Button
              className='h-12 rounded-xl px-5 text-base'
              nativeButton={false}
              render={<a aria-label='How it works' href='#how-it-works' />}
              variant='ghost'
            >
              How it works
            </Button>
          </div>
          <ul className='mt-8 flex flex-wrap gap-x-6 gap-y-3' aria-label='Veo benefits'>
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
        <HomeBingoPreview />
      </HomeContainer>
    </section>
  );
}

function HomeBingoPreview() {
  return (
    <div className='hero-preview relative mx-auto w-full max-w-xl lg:ml-auto'>
      <div className='bg-primary/8 absolute -inset-6 -z-10 rounded-[3rem] blur-2xl' />
      <Card className='bg-card/90 shadow-primary/10 ring-foreground/8 relative border-0 py-0 shadow-2xl ring-1 backdrop-blur'>
        <CardHeader className='border-border/70 border-b px-5 py-5 sm:px-7 sm:py-6'>
          <div className='flex items-center justify-between gap-4'>
            <div>
              <CardTitle className='text-xl sm:text-2xl'>Daily Bingo</CardTitle>
              <CardDescription className='mt-1'>Team Veo · sample game</CardDescription>
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
                  className={`relative flex aspect-square items-center justify-center rounded-xl border p-2 text-center text-[0.7rem] leading-tight font-medium transition-transform sm:text-sm ${selected ? 'border-primary/20 bg-primary text-primary-foreground shadow-primary/20 shadow-md' : 'border-border/70 bg-muted/55 text-foreground'}`}
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
    </div>
  );
}

function HomeLiveGames({ initialActiveGameCount }: { initialActiveGameCount: number }) {
  const [activeGameCount, setActiveGameCount] = useState(initialActiveGameCount);
  const hasActiveGames = activeGameCount > 0;

  useEffect(() => {
    let cancelled = false;

    async function refreshActiveGameCount() {
      try {
        const { count } = await getActiveGameCount();
        if (!cancelled) {
          setActiveGameCount(count);
        }
      } catch {
        // Keep the last confirmed status when a background refresh fails.
      }
    }

    const interval = window.setInterval(() => void refreshActiveGameCount(), 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, []);

  const status = hasActiveGames
    ? `${activeGameCount} ${activeGameCount === 1 ? 'game is' : 'games are'} in progress`
    : 'No games are in progress right now';

  return (
    <section aria-label='Live game status'>
      <HomeContainer className='pb-20 lg:pb-28'>
        <div className='border-border/70 bg-card/65 flex flex-col gap-8 rounded-3xl border px-6 py-8 shadow-sm sm:px-10 sm:py-10 lg:flex-row lg:items-center lg:justify-between'>
          <div className='max-w-xl'>
            <p className='text-primary text-sm font-semibold tracking-[0.16em] uppercase'>Live now</p>
            <h2 className='mt-3 text-3xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-4xl'>
              See when a game is in progress.
            </h2>
            <p className='text-muted-foreground mt-3 leading-7'>
              This status is based on active Veo games and refreshes every minute.
            </p>
          </div>
          <div
            aria-live='polite'
            className='bg-background flex w-full items-center gap-3 rounded-2xl border px-5 py-4 text-base font-semibold shadow-sm lg:w-auto lg:min-w-75'
          >
            <span aria-hidden='true' className='relative flex size-3'>
              {hasActiveGames && (
                <span className='absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none' />
              )}
              <span
                className={`relative inline-flex size-3 rounded-full ${hasActiveGames ? 'bg-emerald-500' : 'bg-muted-foreground/40'}`}
              />
            </span>
            {status}
          </div>
        </div>
      </HomeContainer>
    </section>
  );
}

function HomeHowItWorks() {
  return (
    <section id='how-it-works' className='scroll-mt-8'>
      <HomeContainer className='py-20 lg:py-28'>
        <div className='mx-auto max-w-2xl text-center'>
          <p className='text-primary text-sm font-semibold tracking-[0.16em] uppercase'>How it works</p>
          <h2 className='mt-4 text-4xl leading-tight font-semibold tracking-[-0.04em] text-balance sm:text-5xl'>
            From the first square to bingo.
          </h2>
          <p className='text-muted-foreground mt-5 text-lg leading-8'>
            Everything you need for an online game together, without the complicated setup.
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
      </HomeContainer>
    </section>
  );
}

function HomeCallToAction() {
  return (
    <section>
      <HomeContainer className='py-16 lg:py-24'>
        <div className='border-border/70 bg-card/65 relative overflow-hidden rounded-3xl border px-6 py-14 text-center shadow-sm sm:px-12 sm:py-16'>
          <div className='bg-primary/10 absolute top-0 left-1/2 h-40 w-80 -translate-x-1/2 -translate-y-2/3 rounded-full blur-3xl' />
          <div className='relative mx-auto max-w-2xl'>
            <h2 className='text-3xl leading-tight font-semibold tracking-[-0.035em] text-balance sm:text-4xl'>
              Ready for your next game together?
            </h2>
            <p className='text-muted-foreground mt-4 text-base leading-7 sm:text-lg'>
              Create your first online bingo and turn familiar moments into a shared game — with your team, friends, or
              community.
            </p>
            <ButtonLink className='shadow-primary/10 mt-8 h-12 rounded-xl px-6 text-base shadow-md' to='/teams'>
              Create your first bingo <ArrowRight data-icon='inline-end' aria-hidden='true' />
            </ButtonLink>
          </div>
        </div>
      </HomeContainer>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className='border-border/60 border-t'>
      <HomeContainer className='flex flex-col items-center justify-between gap-5 py-8 sm:flex-row'>
        <VeoLogo markClassName='size-8' />
        <p className='text-muted-foreground max-w-none text-center text-sm whitespace-nowrap'>
          ✨ Veo is a free side project, built with love. For feedback or issues, visit{' '}
          <a
            className='text-foreground hover:text-primary font-medium underline underline-offset-4'
            href='https://github.com/maxstue/veo'
            rel='noreferrer'
            target='_blank'
          >
            GitHub
          </a>
          . 💌
        </p>
      </HomeContainer>
    </footer>
  );
}

export { HomeCallToAction, HomeFooter, HomeHeader, HomeHero, HomeHowItWorks, HomeLiveGames };
