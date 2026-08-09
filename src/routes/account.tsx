import { createFileRoute, redirect } from '@tanstack/react-router';
import { CircleUserRound, KeyRound, Mail, ShieldCheck } from 'lucide-react';

import { AppHeader } from '#/components/app-header';
import { Badge } from '#/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { getAccount } from '#/lib/account';
import { formatAppDate } from '#/lib/locale';
import { getViewer } from '#/lib/teams';

export const Route = createFileRoute('/account')({
  beforeLoad: async () => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: '/account' } });
    }
  },
  loader: () => getAccount(),
  component: AccountPage,
});

function AccountPage() {
  const { authMethods, user } = Route.useLoaderData();

  return (
    <main className='mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10'>
      <AppHeader />
      <section className='py-10 sm:py-14'>
        <div className='mb-8'>
          <p className='text-primary text-sm font-medium'>Your Veo</p>
          <h1 className='mt-1 text-4xl font-semibold tracking-tight'>Account</h1>
          <p className='text-muted-foreground mt-2'>Your profile and connected sign-in methods.</p>
        </div>

        <div className='grid gap-5 lg:grid-cols-[1fr_22rem]'>
          <Card>
            <CardContent className='flex items-center gap-4 py-6'>
              <span className='bg-accent text-accent-foreground flex size-12 shrink-0 items-center justify-center rounded-xl'>
                <CircleUserRound className='size-6' aria-hidden='true' />
              </span>
              <div className='min-w-0'>
                <p className='truncate text-lg font-semibold'>{user.name}</p>
                <p className='text-muted-foreground mt-1 flex items-center gap-2 text-sm'>
                  <Mail className='size-4 shrink-0' aria-hidden='true' />
                  <span className='truncate'>{user.email}</span>
                </p>
                <p className='text-muted-foreground mt-3 text-sm'>Member since {formatAppDate(user.createdAt)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Sign-in methods</CardTitle>
              <CardDescription>These methods are connected to your Veo account.</CardDescription>
            </CardHeader>
            <CardContent className='grid gap-3'>
              {authMethods.length ? (
                authMethods.map((method) => (
                  <div
                    className='bg-muted flex items-center justify-between gap-3 rounded-lg px-3 py-3'
                    key={method.providerId}
                  >
                    <div className='flex items-center gap-3'>
                      <KeyRound className='text-primary size-4' aria-hidden='true' />
                      <span className='font-medium'>{method.label}</span>
                    </div>
                    <Badge className='shrink-0' variant='secondary'>
                      <ShieldCheck className='size-3.5' aria-hidden='true' />
                      Connected
                    </Badge>
                  </div>
                ))
              ) : (
                <div className='border-muted-foreground/30 text-muted-foreground rounded-lg border border-dashed px-3 py-5 text-sm'>
                  No supported sign-in method could be found for this account.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
}
