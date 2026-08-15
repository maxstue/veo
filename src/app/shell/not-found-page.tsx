import { Home } from 'lucide-react';

import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent } from '#/shared/ui/card';

import { AppHeader } from './app-header';
import { PageShell } from './page-container';

export function NotFoundPage() {
  return (
    <PageShell className='min-h-screen py-5'>
      <AppHeader />
      <section className='grid place-items-center py-20 sm:py-28'>
        <Card className='w-full max-w-lg border-dashed text-center'>
          <CardContent className='py-10'>
            <p className='text-primary text-sm font-medium'>404 · Not found</p>
            <h1 className='mt-2 text-3xl font-semibold tracking-tight'>This page is gone.</h1>
            <p className='text-muted-foreground mx-auto mt-3 max-w-sm'>
              The link may be outdated, or the address may have been entered incorrectly.
            </p>
            <ButtonLink className='mt-6' to='/'>
              <Home aria-hidden='true' />
              Go to home page
            </ButtonLink>
          </CardContent>
        </Card>
      </section>
    </PageShell>
  );
}
