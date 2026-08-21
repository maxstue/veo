import { useRouter } from '@tanstack/react-router';
import { LoaderCircle, Mail, X } from 'lucide-react';
import { useState } from 'react';

import { formatAppDate } from '#/shared/lib/locale';
import { Badge } from '#/shared/ui/badge';
import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '#/shared/ui/card';

import { createInvitation, revokeInvitation } from '../api';

type InvitationStatus = 'active' | 'redeemed' | 'revoked' | 'expired';

export type TeamInvitation = {
  createdAt: Date;
  email: string;
  expiresAt: Date;
  id: string;
  status: InvitationStatus;
};

export function TeamInvitations({ invitations, teamId }: { invitations: TeamInvitation[]; teamId: string }) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string>();

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const email = form.get('email');
    if (typeof email !== 'string') {
      return;
    }
    setError(undefined);
    setIsCreating(true);
    try {
      const result = await createInvitation({ data: { teamId, email } });
      if (result.status === 'already-member') {
        setError('This email address is already a member of this team.');
        return;
      }
      formElement.reset();
      await router.invalidate();
    } catch {
      setError('The invitation email could not be sent. Check the address and try again.');
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>Invite a member by email. Invitations are valid for seven days.</CardDescription>
      </CardHeader>
      <CardContent className='grid gap-4'>
        <form className='flex flex-col gap-3 sm:flex-row' onSubmit={invite}>
          <label className='grid flex-1 gap-2 text-sm font-medium'>
            <span>Email address</span>
            <input
              autoComplete='email'
              className='bg-background focus-visible:border-ring focus-visible:ring-ring/30 h-10 rounded-lg border px-3 outline-none focus-visible:ring-3'
              maxLength={254}
              name='email'
              placeholder='teammate@example.com'
              required
              type='email'
            />
          </label>
          <Button className='self-end' disabled={isCreating} type='submit' variant='outline'>
            {isCreating ? <LoaderCircle className='animate-spin' aria-hidden='true' /> : <Mail aria-hidden='true' />}
            Send invitation
          </Button>
        </form>

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
                  <p className='text-muted-foreground mt-1 text-xs'>
                    Created {formatAppDate(invitation.createdAt)} · Expires {formatAppDate(invitation.expiresAt)}
                  </p>
                  <p className='text-muted-foreground mt-1 text-sm'>{invitation.email}</p>
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
