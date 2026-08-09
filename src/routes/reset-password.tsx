import { createFileRoute } from '@tanstack/react-router';
import { KeyRound, LoaderCircle } from 'lucide-react';
import { type FormEvent, useState } from 'react';

import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { authClient } from '#/lib/auth-client';

export const Route = createFileRoute('/reset-password')({
  validateSearch: (search: Record<string, unknown>) => ({
    error: typeof search.error === 'string' ? search.error : undefined,
    token: typeof search.token === 'string' ? search.token : undefined,
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { error: linkError, token } = Route.useSearch();
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessful, setIsSuccessful] = useState(false);

  const invalidLink = Boolean(linkError) || !token;

  async function resetPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);

    const form = new FormData(event.currentTarget);
    const newPassword = readFormString(form, 'newPassword');
    const passwordConfirmation = readFormString(form, 'passwordConfirmation');

    if (newPassword !== passwordConfirmation) {
      setError('The passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const result = await authClient.resetPassword({ newPassword, token: token! });
    setIsSubmitting(false);

    if (result.error) {
      setError('This reset link is invalid or has expired. Request a new link and try again.');
      return;
    }

    setIsSuccessful(true);
  }

  return (
    <main className='mx-auto grid min-h-screen max-w-6xl place-items-center px-5 py-12 sm:px-8 lg:px-10'>
      <Card className='shadow-primary/10 w-full max-w-md border-0 shadow-2xl'>
        <CardHeader className='text-center'>
          <span className='bg-accent text-accent-foreground mx-auto mb-2 flex size-11 items-center justify-center rounded-lg'>
            <KeyRound className='size-5' aria-hidden='true' />
          </span>
          <CardTitle className='text-2xl'>Reset password</CardTitle>
          <CardDescription>Choose a new password for your Veo account.</CardDescription>
        </CardHeader>
        <CardContent>
          {invalidLink ? (
            <RecoveryMessage message='This reset link is invalid or has expired.' />
          ) : isSuccessful ? (
            <RecoveryMessage message='Your password has been updated. You can now sign in with your new password.' />
          ) : (
            <form className='grid gap-4' onSubmit={resetPassword}>
              <PasswordField label='New password' name='newPassword' />
              <PasswordField label='Confirm new password' name='passwordConfirmation' />
              {error && (
                <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm' role='alert'>
                  {error}
                </p>
              )}
              <Button disabled={isSubmitting} size='lg' type='submit'>
                {isSubmitting && <LoaderCircle className='animate-spin' aria-hidden='true' />}
                Set new password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

function RecoveryMessage({ message }: { message: string }) {
  return (
    <div className='grid gap-5 text-center'>
      <p className='text-muted-foreground text-sm leading-6' role='status'>
        {message}
      </p>
      <ButtonLink search={{ returnTo: undefined }} size='lg' to='/auth'>
        Back to sign in
      </ButtonLink>
    </div>
  );
}

function PasswordField({ label, name }: { label: string; name: string }) {
  return (
    <label className='grid gap-2 text-sm font-medium'>
      {label}
      <input
        autoComplete='new-password'
        className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-11 rounded-lg border px-3 text-base outline-none focus-visible:ring-3'
        minLength={8}
        name={name}
        required
        type='password'
      />
    </label>
  );
}

function readFormString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
