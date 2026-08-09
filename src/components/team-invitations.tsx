import { useRouter } from '@tanstack/react-router';
import { ChevronRight, Copy, Link2, LoaderCircle, X } from 'lucide-react';
import { useState } from 'react';

import { Badge } from '#/components/ui/badge';
import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { formatAppDate } from '#/lib/locale';
import { createInvitation, revokeInvitation } from '#/lib/teams';

type InvitationStatus = 'active' | 'redeemed' | 'revoked' | 'expired';

export type TeamInvitation = {
  createdAt: Date;
  id: string;
  status: InvitationStatus;
};

export function TeamInvitationsPreview({ invitations, teamId }: { invitations: TeamInvitation[]; teamId: string }) {
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
          {activeInvitations} {activeInvitations === 1 ? 'active link' : 'active links'}.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        {invitations.length ? (
          <div className='bg-muted/45 rounded-lg p-3'>
            <p className='font-medium'>
              {activeInvitations} {activeInvitations === 1 ? 'active link' : 'active links'}
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

export function TeamInvitations({ invitations, teamId }: { invitations: TeamInvitation[]; teamId: string }) {
  const router = useRouter();
  const [newLink, setNewLink] = useState<string>();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();

  async function invite() {
    setError(undefined);
    setIsCreating(true);
    try {
      const invitation = await createInvitation({ data: { teamId } });
      setNewLink(`${window.location.origin}/invite/${invitation.token}`);
      await router.invalidate();
    } catch {
      setError('The invitation link could not be created. Please try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Links are valid for seven days and can be used once.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <Button disabled={isCreating} onClick={invite} variant='outline'>
          {isCreating ? <LoaderCircle className='animate-spin' aria-hidden='true' /> : <Link2 aria-hidden='true' />}
          Create invitation link
        </Button>

        {newLink && (
          <div className='border-primary/25 bg-primary/5 flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-center'>
            <div className='min-w-0 flex-1'>
              <p className='text-sm font-medium'>This link is shown only once</p>
              <p className='text-muted-foreground truncate text-sm'>{newLink}</p>
            </div>
            <Button onClick={() => navigator.clipboard.writeText(newLink)} size='sm' variant='outline'>
              <Copy aria-hidden='true' />
              Copy
            </Button>
          </div>
        )}

        {error && (
          <p className='bg-destructive/10 text-destructive rounded-lg px-3 py-2 text-sm' role='alert'>
            {error}
          </p>
        )}

        {invitations.length ? (
          <div className='grid gap-3'>
            {invitations.map((invitation) => (
              <div className='flex items-center justify-between gap-3 rounded-lg border p-3' key={invitation.id}>
                <div>
                  <Badge variant={invitation.status === 'active' ? 'default' : 'secondary'}>
                    {statusLabel[invitation.status]}
                  </Badge>
                  <p className='text-muted-foreground mt-1 text-xs'>Created {formatAppDate(invitation.createdAt)}</p>
                </div>
                {invitation.status === 'active' && (
                  <Button
                    aria-label='Revoke invitation'
                    onClick={async () => {
                      setError(undefined);
                      try {
                        await revokeInvitation({ data: { teamId, invitationId: invitation.id } });
                        await router.invalidate();
                      } catch {
                        setError('The invitation could not be revoked. Reload the page and try again.');
                      }
                    }}
                    size='icon-sm'
                    variant='ghost'
                  >
                    <X aria-hidden='true' />
                  </Button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className='text-muted-foreground py-5 text-center text-sm'>No invitations yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

const statusLabel: Record<InvitationStatus, string> = {
  active: 'Active',
  redeemed: 'Redeemed',
  revoked: 'Revoked',
  expired: 'Expired',
};
