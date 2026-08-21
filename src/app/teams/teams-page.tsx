import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowRight, LoaderCircle, Plus, Users } from 'lucide-react';
import { type ReactNode, type SubmitEvent, useState } from 'react';

import { AppHeader } from '#/app/shell/app-header';
import { PageShell } from '#/app/shell/page-container';
import { formatAppDate } from '#/shared/lib/locale';
import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { createTeam, listTeams } from './api';

export function TeamsLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell className='min-h-screen py-5'>
      <AppHeader />
      <section className='py-10 sm:py-14'>{children}</section>
    </PageShell>
  );
}

export function TeamsHeading() {
  return (
    <div className='mb-8'>
      <p className='text-primary text-sm font-medium'>Your Veo</p>
      <h1 className='mt-1 text-4xl font-semibold tracking-tight'>Teams</h1>
      <p className='text-muted-foreground mt-2'>Choose a team or start a new bingo.</p>
    </div>
  );
}

export function TeamsGrid({ children }: { children: ReactNode }) {
  return <div className='grid gap-5 lg:grid-cols-[1fr_22rem]'>{children}</div>;
}

export function TeamList({ teams }: { teams: Awaited<ReturnType<typeof listTeams>> }) {
  return (
    <div className='grid content-start gap-3'>
      {teams.length ? (
        teams.map((item) => (
          <Link key={item.id} params={{ teamId: item.id }} to='/teams/$teamId'>
            <Card className='hover:border-primary/40 transition-colors'>
              <CardContent className='flex items-center justify-between py-5'>
                <div className='flex items-center gap-3'>
                  <span className='bg-accent text-accent-foreground flex size-10 items-center justify-center rounded-lg'>
                    <Users className='size-5' aria-hidden='true' />
                  </span>
                  <div>
                    <p className='font-semibold'>{item.name}</p>
                    <p className='text-muted-foreground text-sm'>Member since {formatAppDate(item.joinedAt)}</p>
                  </div>
                </div>
                <ArrowRight className='text-muted-foreground size-5' aria-hidden='true' />
              </CardContent>
            </Card>
          </Link>
        ))
      ) : (
        <Card className='border-dashed'>
          <CardContent className='text-muted-foreground py-10 text-center'>
            You have not joined a team yet. Create your first one here.
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export function CreateTeam() {
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setIsSubmitting(true);
    const formValue = new FormData(event.currentTarget).get('name');
    const name = typeof formValue === 'string' ? formValue : '';

    try {
      const result = await createTeam({ data: { name } });
      await router.invalidate();
      await navigate({ to: '/teams/$teamId', params: { teamId: result.teamId } });
    } catch {
      setError('The team could not be created. Check the name and try again.');
      setIsSubmitting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New team</CardTitle>
        <CardDescription>You will automatically become the first member.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className='space-y-4' onSubmit={submit}>
          <label className='grid gap-2 text-sm font-medium'>
            <span>Team name</span>
            <input
              className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-11 rounded-lg border px-3 text-base outline-none focus-visible:ring-3'
              maxLength={80}
              minLength={2}
              name='name'
              placeholder='Frontend Guild'
              required
            />
          </label>
          {error && (
            <p className='text-destructive text-sm' role='alert'>
              {error}
            </p>
          )}
          <Button className='w-full' disabled={isSubmitting} type='submit'>
            {isSubmitting ? <LoaderCircle className='animate-spin' aria-hidden='true' /> : <Plus aria-hidden='true' />}
            Create team
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
