import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, LoaderCircle, TicketCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { PageShell } from '#/app/shell/page-container';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { getGameSessionInvitation, redeemGameSessionInvitation } from './api';

export function GameSessionInvitationLayout({ children }: { children: React.ReactNode }) {
  return <PageShell className='grid min-h-screen place-items-center py-10'>{children}</PageShell>;
}

export function GameSessionInvitationCard({
  invitation,
  token,
  viewer,
}: {
  invitation: Awaited<ReturnType<typeof getGameSessionInvitation>>;
  token: string;
  viewer: { id: string; name: string } | null;
}) {
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string>();
  const returnTo = `/sessions/join/${token}`;
  const available = invitation.status === 'active' || invitation.status === 'created';
  const invitationDescription = available
    ? getInvitationDescription(invitation.status)
    : unavailableText[invitation.status];

  async function join() {
    setError(undefined);
    setIsJoining(true);
    try {
      const result = await redeemGameSessionInvitation({ data: { token } });
      await navigate({ to: '/teams/$teamId/sessions/$sessionId', params: result });
    } catch {
      setError('This session could not be joined. It may have ended.');
      setIsJoining(false);
    }
  }

  return (
    <Card className='shadow-primary/10 w-full max-w-md border-0 text-center shadow-2xl'>
      <CardHeader>
        <Link className='mx-auto mb-4 flex items-center gap-2 no-underline' to='/'>
          <span className='bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-lg'>
            <Eye className='size-5' aria-hidden='true' />
          </span>
          <span className='font-heading text-xl font-semibold'>veo</span>
        </Link>
        <span
          className={`mx-auto mb-2 flex size-12 items-center justify-center rounded-lg ${available ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}
        >
          {available ? <TicketCheck aria-hidden='true' /> : <TriangleAlert aria-hidden='true' />}
        </span>
        <CardTitle>{available ? `Join bingo with ${invitation.teamName}` : 'Session unavailable'}</CardTitle>
        <CardDescription>{invitationDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {available && !viewer && (
          <ButtonLink className='w-full' search={{ returnTo }} size='lg' to='/auth'>
            Sign in and join
          </ButtonLink>
        )}
        {available && viewer && (
          <Button className='w-full' disabled={isJoining} onClick={() => void join()} size='lg'>
            {isJoining && <LoaderCircle className='animate-spin' aria-hidden='true' />}
            Join as {viewer.name}
          </Button>
        )}
        {error && (
          <p className='text-destructive mt-4 text-sm' role='alert'>
            {error}
          </p>
        )}
        {!available && (
          <ButtonLink className='w-full' to='/' variant='outline'>
            Go to home page
          </ButtonLink>
        )}
      </CardContent>
    </Card>
  );
}

const unavailableText = {
  ended: 'This bingo session has already ended.',
  invalid: 'This session link is invalid.',
} as const;

function getInvitationDescription(status: 'active' | 'created') {
  return status === 'created'
    ? 'Join the team and wait with everyone for the session to start.'
    : 'Join the team and play in this live bingo session.';
}
