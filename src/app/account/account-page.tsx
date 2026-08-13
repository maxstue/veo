import { useNavigate, useRouter } from '@tanstack/react-router';
import { CircleUserRound, KeyRound, LoaderCircle, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { type ReactNode, type SubmitEvent, useRef, useState } from 'react';

import { AccountSecurity } from '#/app/account/account-security';
import { authClient } from '#/app/auth/client';
import { AppHeader } from '#/app/shell/app-header';
import { formatAppDate } from '#/shared/lib/locale';
import { Badge } from '#/shared/ui/badge';
import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { getAccount } from './api';

type Account = Awaited<ReturnType<typeof getAccount>>;

function AccountLayout({ children }: { children: ReactNode }) {
  return (
    <main className='mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10'>
      <AppHeader />
      <section className='py-10 sm:py-14'>{children}</section>
    </main>
  );
}

function AccountHeading() {
  return (
    <div className='mb-8'>
      <p className='text-primary text-sm font-medium'>Your Veo</p>
      <h1 className='mt-1 text-4xl font-semibold tracking-tight'>Account</h1>
      <p className='text-muted-foreground mt-2'>Your profile and connected sign-in methods.</p>
    </div>
  );
}

function AccountSummary({ account: { authMethods, user } }: { account: Account }) {
  return (
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
                  <ShieldCheck className='size-3.5' aria-hidden='true' /> Connected
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
  );
}

function AccountSecuritySection({ email }: { email: string }) {
  return <AccountSecurity email={email} />;
}

function AccountDeletion() {
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string>();
  const [deleting, setDeleting] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const router = useRouter();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    if (confirmation !== 'DELETE') {
      setError('Type DELETE to confirm that you want to permanently delete your account.');
      return;
    }
    setDeleting(true);
    const result = await authClient.deleteUser();
    if (result.error) {
      setError(result.error.message || 'Your account could not be deleted. Please check your password and try again.');
      setDeleting(false);
      return;
    }
    await authClient.signOut();
    await router.invalidate();
    await navigate({ href: '/auth' });
  }

  return (
    <>
      <Card className='border-destructive/50 mt-8'>
        <CardHeader>
          <CardTitle className='text-destructive'>Delete account</CardTitle>
          <CardDescription>Permanently delete your account and personal data. This cannot be undone.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => dialog.current?.showModal()} type='button' variant='destructive'>
            <Trash2 aria-hidden='true' /> Delete account
          </Button>
        </CardContent>
      </Card>
      <dialog
        aria-labelledby='delete-account-title'
        className='m-auto w-[calc(100%-2rem)] max-w-lg border-0 bg-transparent p-0 [&::backdrop]:bg-black/60 [&::backdrop]:backdrop-blur-sm'
        onCancel={(event) => deleting && event.preventDefault()}
        onClose={() => {
          setConfirmation('');
          setError(undefined);
        }}
        ref={dialog}
      >
        <div className='bg-background text-foreground rounded-xl border p-6 shadow-2xl'>
          <h2 className='text-destructive text-xl font-semibold' id='delete-account-title'>
            Permanently delete account?
          </h2>
          <p className='text-muted-foreground mt-2 text-sm leading-6'>
            Your account and personal data will be deleted. This action cannot be undone.
          </p>
          <form className='mt-6 grid gap-4' onSubmit={submit}>
            <label className='grid gap-2 text-sm font-medium'>
              Type DELETE to confirm{' '}
              <input
                className='bg-background h-10 rounded-lg border px-3'
                disabled={deleting}
                onChange={(event) => setConfirmation(event.target.value)}
                value={confirmation}
              />
            </label>
            {error && (
              <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm' role='alert'>
                {error}
              </p>
            )}
            <div className='flex justify-end gap-3'>
              <Button disabled={deleting} onClick={() => dialog.current?.close()} type='button' variant='outline'>
                Cancel
              </Button>
              <Button disabled={deleting} type='submit' variant='destructive'>
                {deleting && <LoaderCircle className='animate-spin' aria-hidden='true' />} Delete account permanently
              </Button>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}

export { AccountDeletion, AccountHeading, AccountLayout, AccountSecuritySection, AccountSummary };
