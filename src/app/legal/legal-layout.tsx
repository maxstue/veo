import { type ReactNode } from 'react';

import { AppHeader } from '#/app/shell/app-header';
import { PageShell } from '#/app/shell/page-container';

export function LegalPage({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <PageShell className='min-h-screen py-5'>
      <AppHeader />
      <article className='mx-auto max-w-3xl py-12 sm:py-16'>
        <h1 className='text-3xl font-semibold tracking-tight sm:text-4xl'>{title}</h1>
        <p className='text-muted-foreground mt-3'>{subtitle}</p>
        {children}
      </article>
    </PageShell>
  );
}

export function LegalSection({ children, id, title }: { children: ReactNode; id?: string; title: string }) {
  return (
    <section
      className='[&_a]:text-primary mt-10 scroll-mt-6 space-y-3 leading-relaxed [&_a]:underline [&_a]:underline-offset-4'
      id={id}
    >
      <h2 className='text-xl font-semibold tracking-tight'>{title}</h2>
      {children}
    </section>
  );
}
