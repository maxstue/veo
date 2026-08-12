import { Link, useNavigate } from '@tanstack/react-router';
import { Eye, LoaderCircle, TicketCheck, TriangleAlert } from 'lucide-react';
import { useState } from 'react';

import { getInvitation, getViewer, redeemInvitation } from '#/app/teams/api';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

function InvitationLayout({ children }: { children: React.ReactNode }) {
  return <main className='grid min-h-screen place-items-center px-5 py-10'>{children}</main>;
}

function InvitationCard({
  invitation,
  token,
  viewer,
}: {
  invitation: Awaited<ReturnType<typeof getInvitation>>;
  token: string;
  viewer: Awaited<ReturnType<typeof getViewer>>;
}) {
  const navigate = useNavigate();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string>();
  const returnTo = `/invite/${token}`;

  async function redeem() {
    setIsRedeeming(true);
    setError(undefined);
    try {
      const result = await redeemInvitation({ data: { token } });
      await navigate({ to: '/teams/$teamId', params: { teamId: result.teamId } });
    } catch {
      setError('This invitation could not be redeemed. It may already have been used.');
      setIsRedeeming(false);
    }
  }

  const valid = invitation.status === 'valid';

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
          className={`mx-auto mb-2 flex size-12 items-center justify-center rounded-lg ${valid ? 'bg-accent text-accent-foreground' : 'bg-destructive/10 text-destructive'}`}
        >
          {valid ? <TicketCheck aria-hidden='true' /> : <TriangleAlert aria-hidden='true' />}
        </span>
        <CardTitle>{valid ? `Invitation to ${invitation.teamName}` : 'Invitation unavailable'}</CardTitle>
        <CardDescription>
          {valid ? 'Accept the invitation and join this Veo team.' : unavailableText[invitation.status]}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {valid && !viewer && (
          <ButtonLink className='w-full' search={{ returnTo }} size='lg' to='/auth'>
            Sign in and join
          </ButtonLink>
        )}
        {valid && viewer && (
          <Button className='w-full' disabled={isRedeeming} onClick={redeem} size='lg'>
            {isRedeeming && <LoaderCircle className='animate-spin' aria-hidden='true' />}Join as {viewer.name}
          </Button>
        )}
        {error && (
          <p className='text-destructive mt-4 text-sm' role='alert'>
            {error}
          </p>
        )}
        {!valid && (
          <ButtonLink className='w-full' to='/' variant='outline'>
            Go to home page
          </ButtonLink>
        )}
      </CardContent>
    </Card>
  );
}

const unavailableText = {
  invalid: 'This link is invalid.',
  expired: 'This link has expired.',
  revoked: 'This link has been revoked.',
  redeemed: 'This link has already been redeemed.',
} as const;

export { InvitationCard, InvitationLayout };
