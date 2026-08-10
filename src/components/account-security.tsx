import { KeyRound, LoaderCircle, Mail } from 'lucide-react';
import { type SubmitEvent, useState } from 'react';

import { authClient } from '#/lib/auth-client';

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function AccountSecurity({ email }: { email: string }) {
  const [changeError, setChangeError] = useState<string>();
  const [changeSuccess, setChangeSuccess] = useState<string>();
  const [isChanging, setIsChanging] = useState(false);
  const [isRequestingReset, setIsRequestingReset] = useState(false);
  const [resetError, setResetError] = useState<string>();
  const [resetSuccess, setResetSuccess] = useState<string>();

  async function changePassword(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setChangeError(undefined);
    setChangeSuccess(undefined);

    const form = new FormData(formElement);
    const currentPassword = readFormString(form, 'currentPassword');
    const newPassword = readFormString(form, 'newPassword');
    const passwordConfirmation = readFormString(form, 'passwordConfirmation');

    if (newPassword !== passwordConfirmation) {
      setChangeError('The new passwords do not match.');
      return;
    }
    if (newPassword === currentPassword) {
      setChangeError('Choose a new password that is different from your current password.');
      return;
    }

    setIsChanging(true);
    const result = await authClient.changePassword({ currentPassword, newPassword, revokeOtherSessions: true });
    setIsChanging(false);

    if (result.error) {
      setChangeError(result.error.message || 'Your password could not be changed. Please check your current password.');
      return;
    }

    formElement.reset();
    setChangeSuccess('Your password has been updated. Other active sessions were signed out.');
  }

  async function requestPasswordReset() {
    setResetError(undefined);
    setResetSuccess(undefined);
    setIsRequestingReset(true);

    const result = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsRequestingReset(false);

    if (result.error) {
      setResetError(result.error.message || 'The reset email could not be requested. Please try again.');
      return;
    }

    setResetSuccess('If this account supports password sign-in, a reset link has been sent to your email address.');
  }

  return (
    <Card className='mt-8'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <KeyRound className='text-primary size-5' aria-hidden='true' />
          Password
        </CardTitle>
        <CardDescription>Change your password or request a secure reset link by email.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-8 lg:grid-cols-2'>
        <form className='grid gap-4' onSubmit={changePassword}>
          <h3 className='font-semibold'>Change password</h3>
          <PasswordField autoComplete='current-password' label='Current password' name='currentPassword' />
          <PasswordField autoComplete='new-password' label='New password' name='newPassword' />
          <PasswordField autoComplete='new-password' label='Confirm new password' name='passwordConfirmation' />
          {changeError && <Message kind='error'>{changeError}</Message>}
          {changeSuccess && <Message kind='success'>{changeSuccess}</Message>}
          <Button className='w-fit' disabled={isChanging} type='submit'>
            {isChanging && <LoaderCircle className='animate-spin' aria-hidden='true' />}
            Update password
          </Button>
        </form>

        <div className='border-border grid content-start gap-4 border-t pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8'>
          <h3 className='font-semibold'>Forgot your password?</h3>
          <p className='text-muted-foreground text-sm leading-6'>
            We will email a one-time link to <strong className='text-foreground'>{email}</strong>. The link expires
            after one hour.
          </p>
          {resetError && <Message kind='error'>{resetError}</Message>}
          {resetSuccess && <Message kind='success'>{resetSuccess}</Message>}
          <Button
            className='w-fit'
            disabled={isRequestingReset}
            onClick={requestPasswordReset}
            type='button'
            variant='outline'
          >
            {isRequestingReset ? (
              <LoaderCircle className='animate-spin' aria-hidden='true' />
            ) : (
              <Mail aria-hidden='true' />
            )}
            Send reset link
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function PasswordField({ autoComplete, label, name }: { autoComplete: string; label: string; name: string }) {
  return (
    <label className='grid gap-2 text-sm font-medium'>
      {label}
      <input
        autoComplete={autoComplete}
        className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 rounded-lg border px-3 text-base outline-none focus-visible:ring-3'
        minLength={8}
        name={name}
        required
        type='password'
      />
    </label>
  );
}

function Message({ children, kind }: { children: string; kind: 'error' | 'success' }) {
  if (kind === 'error') {
    return (
      <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm' role='alert'>
        {children}
      </p>
    );
  }

  return (
    <output className='rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400'>
      {children}
    </output>
  );
}

function readFormString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
