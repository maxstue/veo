import { CircleUserRound, LogOut, Users } from 'lucide-react';

import { authClient } from '#/lib/auth-client';

import { Button } from './ui/button';
import { ButtonLink } from './ui/button-link';

export function AuthControls() {
  const { data: session, isPending, refetch } = authClient.useSession();

  if (isPending) {
    return <div className='bg-muted h-9 w-24 animate-pulse rounded-lg' aria-label='Loading' />;
  }

  if (!session) {
    return (
      <ButtonLink search={{ returnTo: undefined }} size='sm' to='/auth'>
        Sign in
      </ButtonLink>
    );
  }

  return (
    <div className='flex items-center gap-2'>
      <ButtonLink aria-label='Account' size='sm' to='/account' variant='ghost'>
        <CircleUserRound aria-hidden='true' />
        <span className='hidden max-w-36 truncate sm:inline'>{session.user.name}</span>
      </ButtonLink>
      <ButtonLink aria-label='Teams' size='sm' to='/teams' variant='ghost'>
        <Users aria-hidden='true' />
        <span className='hidden sm:inline'>Teams</span>
      </ButtonLink>
      <Button
        aria-label='Sign out'
        onClick={async () => {
          await authClient.signOut();
          await refetch();
        }}
        size='icon-sm'
        variant='outline'
      >
        <LogOut aria-hidden='true' />
      </Button>
    </div>
  );
}
