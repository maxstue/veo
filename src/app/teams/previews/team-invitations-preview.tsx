import { ChevronRight, Link2 } from 'lucide-react';

import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

type TeamInvitationPreviewItem = { status: 'active' | 'redeemed' | 'revoked' | 'expired' };

export function TeamInvitationsPreview({
  invitations,
  teamId,
}: {
  invitations: TeamInvitationPreviewItem[];
  teamId: string;
}) {
  const activeInvitations = invitations.filter((invitation) => invitation.status === 'active').length;
  const pastInvitations = invitations.length - activeInvitations;

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Link2 className='text-primary size-5 dark:text-violet-300' aria-hidden='true' />
          Invitations
        </CardTitle>
        <CardDescription>
          {activeInvitations} {activeInvitations === 1 ? 'pending invitation' : 'pending invitations'}.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        {invitations.length ? (
          <div className='bg-muted/45 rounded-lg p-3'>
            <p className='font-medium'>
              {activeInvitations} {activeInvitations === 1 ? 'pending invitation' : 'pending invitations'}
            </p>
            <p className='text-muted-foreground mt-1 text-sm'>
              {pastInvitations} {pastInvitations === 1 ? 'past invitation' : 'past invitations'}
            </p>
          </div>
        ) : (
          <p className='bg-muted/45 text-muted-foreground rounded-lg p-3 text-sm'>No invitations yet.</p>
        )}
        <ButtonLink className='mt-auto w-full' params={{ teamId }} to='/teams/$teamId/invitations' variant='outline'>
          Manage invitations
          <ChevronRight aria-hidden='true' />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}
