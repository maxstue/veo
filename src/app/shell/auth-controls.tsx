import { CircleUserRound, LogOut, Users } from 'lucide-react';

import { authClient } from '#/app/auth/client';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';

export function AuthControls() {
  const { data: session, isPending, refetch } = authClient.useSession();

  if (isPending) {
    return (
      <div className='flex items-center gap-2' aria-label='Loading account controls' aria-busy='true'>
        <Button
          className='bg-muted w-9 animate-pulse border-transparent sm:w-20'
          disabled
          size='sm'
          tabIndex={-1}
          variant='ghost'
        />
        <Button
          className='bg-muted w-9 animate-pulse border-transparent sm:w-18'
          disabled
          size='sm'
          tabIndex={-1}
          variant='ghost'
        />
        <Button
          className='bg-muted animate-pulse border-transparent'
          disabled
          size='icon-sm'
          tabIndex={-1}
          variant='outline'
        />
      </div>
    );
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
