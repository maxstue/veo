import { Link, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Eye, LoaderCircle, LockKeyhole } from 'lucide-react';
import { type InputHTMLAttributes, type ReactNode, type SubmitEvent, useState } from 'react';

import { PageShell } from '#/app/shell/page-container';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { authClient } from './client';

type AuthMode = 'forgot-password' | 'sign-in' | 'sign-up';

export function AuthLayout({ children }: { children: ReactNode }) {
  return <PageShell className='flex min-h-screen flex-col py-5'>{children}</PageShell>;
}

export function AuthHeader() {
  return (
    <header className='flex items-center justify-between'>
      <Link className='flex items-center gap-2 no-underline' to='/' aria-label='Veo home'>
        <span className='bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg shadow-sm'>
          <Eye className='size-5' aria-hidden='true' />
        </span>
        <span className='font-heading text-xl font-semibold tracking-tight'>veo</span>
      </Link>
      <ButtonLink size='sm' to='/' variant='ghost'>
        <ArrowLeft aria-hidden='true' /> Back
      </ButtonLink>
    </header>
  );
}

export function AuthPanel({ returnTo }: { returnTo: string | undefined }) {
  const [mode, setMode] = useState<AuthMode>('sign-in');
  const [error, setError] = useState<string>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<string>();
  const navigate = useNavigate();
  const router = useRouter();

  async function submit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setNotice(undefined);
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    const email = getFormString(form, 'email').trim();
    const password = getFormString(form, 'password');
    const name = getFormString(form, 'name').trim();

    if (mode === 'forgot-password') {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: `${window.location.origin}/reset-password`,
      });
      setIsSubmitting(false);

      if (result.error) {
        setError(result.error.message || 'The reset email could not be requested. Please try again.');
        return;
      }

      setNotice('If an account exists for this email address, a password reset link has been sent.');
      return;
    }

    const result =
      mode === 'sign-up'
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password });

    if (result.error) {
      setError(result.error.message || 'Authentication failed. Please try again.');
      setIsSubmitting(false);
      return;
    }

    await router.invalidate();
    await navigate({ href: returnTo ?? '/' });
  }

  return (
    <section className='grid flex-1 place-items-center py-12'>
      <Card className='shadow-primary/10 w-full max-w-md border-0 shadow-2xl'>
        <CardHeader className='text-center'>
          <span className='bg-accent text-accent-foreground mx-auto mb-2 flex size-11 items-center justify-center rounded-lg'>
            <LockKeyhole className='size-5' aria-hidden='true' />
          </span>
          <CardTitle className='text-2xl'>{getTitle(mode)}</CardTitle>
          <CardDescription>
            {mode === 'sign-in' && 'Sign in to play bingo with your team.'}
            {mode === 'sign-up' && 'One account works across all your Veo teams.'}
            {mode === 'forgot-password' && 'Enter your email address and we will send you a secure reset link.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === 'forgot-password' ? (
            <Button
              className='mb-6'
              onClick={() => {
                setMode('sign-in');
                setError(undefined);
                setNotice(undefined);
              }}
              type='button'
              variant='ghost'
            >
              <ArrowLeft aria-hidden='true' />
              Back to sign in
            </Button>
          ) : (
            <div className='bg-muted mb-6 grid grid-cols-2 rounded-lg p-1'>
              <Button
                aria-pressed={mode === 'sign-in'}
                onClick={() => {
                  setMode('sign-in');
                  setError(undefined);
                  setNotice(undefined);
                }}
                type='button'
                variant={mode === 'sign-in' ? 'default' : 'ghost'}
              >
                Sign in
              </Button>
              <Button
                aria-pressed={mode === 'sign-up'}
                onClick={() => {
                  setMode('sign-up');
                  setError(undefined);
                  setNotice(undefined);
                }}
                type='button'
                variant={mode === 'sign-up' ? 'default' : 'ghost'}
              >
                Sign up
              </Button>
            </div>
          )}

          <form className='space-y-4' onSubmit={submit}>
            {mode === 'sign-up' && <Field label='Name' name='name' autoComplete='name' placeholder='Your name' />}
            <Field label='Email' name='email' autoComplete='email' placeholder='you@example.com' type='email' />
            {mode !== 'forgot-password' && (
              <Field
                label='Password'
                name='password'
                autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
                minLength={8}
                placeholder='At least 8 characters'
                type='password'
              />
            )}

            {error && (
              <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm' role='alert'>
                {error}
              </p>
            )}
            {notice && (
              <output className='block rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400'>
                {notice}
              </output>
            )}

            <Button className='w-full' disabled={isSubmitting} size='lg' type='submit'>
              {isSubmitting && <LoaderCircle className='animate-spin' aria-hidden='true' />}
              {getSubmitLabel(mode)}
            </Button>
          </form>

          {mode === 'sign-in' && (
            <Button
              className='mx-auto mt-4 flex'
              onClick={() => {
                setMode('forgot-password');
                setError(undefined);
                setNotice(undefined);
              }}
              type='button'
              variant='link'
            >
              Forgot your password?
            </Button>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

function getSubmitLabel(mode: AuthMode) {
  if (mode === 'sign-in') {
    return 'Sign in';
  }
  if (mode === 'sign-up') {
    return 'Create account';
  }
  return 'Send reset link';
}

function getTitle(mode: AuthMode) {
  if (mode === 'sign-in') {
    return 'Welcome back';
  }
  if (mode === 'sign-up') {
    return 'Create your Veo account';
  }
  return 'Reset your password';
}

function getFormString(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}

function Field({
  label,
  name,
  ...inputProps
}: { label: string; name: string } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className='grid gap-2 text-sm font-medium'>
      {label}
      <input
        className='bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/30 h-11 rounded-lg border px-3 text-base transition-shadow outline-none focus-visible:ring-3'
        name={name}
        required
        {...inputProps}
      />
    </label>
  );
}
