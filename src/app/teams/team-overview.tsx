import { ArrowLeft } from 'lucide-react';
import { type ReactNode } from 'react';

import { AppHeader } from '#/app/shell/app-header';
import { PageShell } from '#/app/shell/page-container';
import { ButtonLink } from '#/shared/ui/button-link';

export function TeamOverviewLayout({ children }: { children: ReactNode }) {
  return (
    <PageShell className='min-h-screen py-5'>
      <AppHeader />
      <section className='py-10 sm:py-14'>{children}</section>
    </PageShell>
  );
}

export function TeamOverviewHeading({ name }: { name: string }) {
  return (
    <>
      <ButtonLink className='mb-5' size='sm' to='/teams' variant='ghost'>
        <ArrowLeft aria-hidden='true' /> All teams
      </ButtonLink>
      <div className='mb-8'>
        <p className='text-primary text-sm font-medium dark:text-violet-300'>Team overview</p>
        <h1 className='mt-1 text-4xl font-semibold tracking-tight'>{name}</h1>
      </div>
    </>
  );
}

export function TeamOverviewGrid({ children }: { children: ReactNode }) {
  return <div className='grid gap-5 lg:grid-cols-2'>{children}</div>;
}
