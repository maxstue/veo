import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { Eye, LoaderCircle, TicketCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { getGameSessionInvitation, redeemGameSessionInvitation } from '#/lib/game-sessions';
import { getViewer } from '#/lib/teams';

export const Route = createFileRoute('/sessions/join/$token')({
  loader: async ({ params }) => ({
    invitation: await getGameSessionInvitation({ data: { token: params.token } }),
    viewer: await getViewer(),
  }),
  component: GameSessionInvitationPage,
});

function GameSessionInvitationPage() {
  const { invitation, viewer } = Route.useLoaderData();
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string>();
  const returnTo = `/sessions/join/${token}`;
  const available = invitation.status === 'active' || invitation.status === 'created';

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
    <main className='grid min-h-screen place-items-center px-5 py-10'>
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
          <CardDescription>
            {available
              ? invitation.status === 'created'
                ? 'Join the team and wait with everyone for the session to start.'
                : 'Join the team and play in this live bingo session.'
              : unavailableText[invitation.status]}
          </CardDescription>
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
    </main>
  );
}

const unavailableText = {
  ended: 'This bingo session has already ended.',
  invalid: 'This session link is invalid.',
} as const;
