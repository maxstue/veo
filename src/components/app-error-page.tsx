import { Link, type ErrorComponentProps } from '@tanstack/react-router';
import { Eye, RotateCcw, TriangleAlert } from 'lucide-react';
import { useEffect } from 'react';

import { Errors } from '#/lib/observability/errors';

import { Button } from './ui/button';
import { ButtonLink } from './ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AppErrorPage({ error, reset }: ErrorComponentProps) {
  useEffect(() => {
    Errors.captureRouteError(error);
  }, [error]);

  return (
    <main className='grid min-h-screen place-items-center px-5 py-10'>
      <Card className='shadow-primary/10 w-full max-w-lg border-0 text-center shadow-2xl'>
        <CardHeader>
          <Link className='mx-auto mb-4 flex items-center gap-2 no-underline' to='/'>
            <span className='bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg'>
              <Eye className='size-5' aria-hidden='true' />
            </span>
            <span className='font-heading text-xl font-semibold'>veo</span>
          </Link>
          <span className='bg-destructive/10 text-destructive mx-auto mb-2 flex size-12 items-center justify-center rounded-lg'>
            <TriangleAlert aria-hidden='true' />
          </span>
          <CardTitle>Veo could not load this page</CardTitle>
          <CardDescription>Please try again. If the problem persists, return to the home page.</CardDescription>
        </CardHeader>
        <CardContent className='flex flex-col gap-2 sm:flex-row sm:justify-center'>
          <Button onClick={reset}>
            <RotateCcw aria-hidden='true' />
            Try again
          </Button>
          <ButtonLink to='/' variant='outline'>
            Go to home page
          </ButtonLink>
        </CardContent>
      </Card>
    </main>
  );
}
