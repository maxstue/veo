import { CircleUserRound, LogOut, Users } from 'lucide-react';

import { authClient } from '#/app/auth/client';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';

type AuthSession = typeof authClient.$Infer.Session;

export function AuthControls({ initialSession }: { initialSession: AuthSession | null }) {
  if (!initialSession) {
    return <SignInControl />;
  }

  return <SessionControls initialSession={initialSession} />;
}

function SignInControl() {
  return (
    <ButtonLink search={{ returnTo: undefined }} size='sm' to='/auth'>
      Sign in
    </ButtonLink>
  );
}

function SessionControls({ initialSession }: { initialSession: AuthSession }) {
  if (import.meta.env.SSR) {
    return <AuthenticatedControls session={initialSession} />;
  }

  authClient.hydrateSession(initialSession);
  const { data, isPending, isRefetching, refetch } = authClient.useSession();
  const session = isPending && !isRefetching ? initialSession : data;

  if (!session) {
    return <SignInControl />;
  }

  return <AuthenticatedControls onSignOut={async () => refetch()} session={session} />;
}

function AuthenticatedControls({ onSignOut, session }: { onSignOut?: () => Promise<void>; session: AuthSession }) {
  return (
    <div className='flex items-center gap-2'>
      <ButtonLink aria-label='Account' className='w-9 sm:w-20' size='sm' to='/account' variant='ghost'>
        <CircleUserRound aria-hidden='true' />
        <span className='hidden max-w-36 truncate sm:inline'>{session.user.name}</span>
      </ButtonLink>
      <ButtonLink aria-label='Teams' className='w-9 sm:w-18' size='sm' to='/teams' variant='ghost'>
        <Users aria-hidden='true' />
        <span className='hidden sm:inline'>Teams</span>
      </ButtonLink>
      <Button
        aria-label='Sign out'
        onClick={async () => {
          await authClient.signOut();
          await onSignOut?.();
        }}
        size='icon-sm'
        variant='outline'
      >
        <LogOut aria-hidden='true' />
      </Button>
    </div>
  );
}
