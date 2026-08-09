import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import { CircleUserRound, KeyRound, LoaderCircle, Mail, ShieldCheck, Trash2 } from 'lucide-react';
import { type FormEvent, useRef, useState } from 'react';

import { AppHeader } from '#/components/app-header';
import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { getAccount } from '#/lib/account';
import { authClient } from '#/lib/auth-client';
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
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState<string>();
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const navigate = useNavigate();
  const router = useRouter();

  async function deleteAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDeleteError(undefined);

    if (deleteConfirmation !== 'DELETE') {
      setDeleteError('Type DELETE to confirm that you want to permanently delete your account.');
      return;
    }

    setIsDeleting(true);
    const result = await authClient.deleteUser();

    if (result.error) {
      setDeleteError(
        result.error.message || 'Your account could not be deleted. Please check your password and try again.',
      );
      setIsDeleting(false);
      return;
    }

    await authClient.signOut();
    await router.invalidate();
    await navigate({ href: '/auth' });
  }

  function openDeleteConfirmation() {
    setDeleteConfirmation('');
    setDeleteError(undefined);
    deleteDialog.current?.showModal();
  }

  function closeDeleteConfirmation() {
    deleteDialog.current?.close();
  }

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

        <Card className='border-destructive/50 mt-8'>
          <CardHeader>
            <CardTitle className='text-destructive'>Delete account</CardTitle>
            <CardDescription>
              Permanently delete your Veo account, sign-in methods, sessions, and personal data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={openDeleteConfirmation} type='button' variant='destructive'>
              <Trash2 aria-hidden='true' />
              Delete account
            </Button>
          </CardContent>
        </Card>

        <dialog
          aria-describedby='delete-account-description'
          aria-labelledby='delete-account-title'
          className='m-auto max-h-[calc(100vh-2rem)] w-[calc(100%-2rem)] max-w-lg overflow-visible border-0 bg-transparent p-0 [&::backdrop]:bg-black/60 [&::backdrop]:backdrop-blur-sm'
          onCancel={(event) => {
            if (isDeleting) {
              event.preventDefault();
            }
          }}
          onClose={() => {
            setDeleteConfirmation('');
            setDeleteError(undefined);
          }}
          ref={deleteDialog}
        >
          <div className='bg-background text-foreground rounded-xl border p-6 shadow-2xl'>
            <h2 className='text-destructive text-xl font-semibold' id='delete-account-title'>
              Permanently delete account?
            </h2>
            <p className='text-muted-foreground mt-2 text-sm leading-6' id='delete-account-description'>
              Your account, sign-in methods, sessions, and personal data will be deleted. This action cannot be undone.
            </p>

            <form className='mt-6 grid gap-4' onSubmit={deleteAccount}>
              <label className='grid gap-2 text-sm font-medium'>
                Type DELETE to confirm
                <input
                  autoComplete='off'
                  autoFocus
                  className='bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 h-10 rounded-lg border px-3 text-base transition-shadow outline-none focus-visible:ring-3'
                  disabled={isDeleting}
                  onChange={(event) => setDeleteConfirmation(event.target.value)}
                  placeholder='DELETE'
                  value={deleteConfirmation}
                />
              </label>
              {deleteError && (
                <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm' role='alert'>
                  {deleteError}
                </p>
              )}
              <div className='flex flex-wrap justify-end gap-3'>
                <Button disabled={isDeleting} onClick={closeDeleteConfirmation} type='button' variant='outline'>
                  Cancel
                </Button>
                <Button disabled={isDeleting} type='submit' variant='destructive'>
                  {isDeleting && <LoaderCircle className='animate-spin' aria-hidden='true' />}
                  Delete account permanently
                </Button>
              </div>
            </form>
          </div>
        </dialog>
      </section>
    </main>
  );
}
