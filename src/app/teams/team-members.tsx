import { useRouter } from '@tanstack/react-router';
import { LoaderCircle, UserRound, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader } from '#/shared/ui/card';

import { removeTeamMember, updateTeamMemberRole } from './api';

export type TeamMember = { email: string; id: string; membershipId: string; name: string; role: string };

export function TeamMembers({
  members,
  teamId,
  viewerRole,
}: {
  members: TeamMember[];
  teamId: string;
  viewerRole: string;
}) {
  const router = useRouter();
  const [pendingMemberId, setPendingMemberId] = useState<string>();
  const [error, setError] = useState<string>();

  async function changeRole(teamMember: TeamMember, role: 'owner' | 'member') {
    setPendingMemberId(teamMember.membershipId);
    setError(undefined);
    try {
      await updateTeamMemberRole({ data: { teamId, membershipId: teamMember.membershipId, role } });
      await router.invalidate();
    } catch {
      setError('The role could not be changed. A team must always keep at least one owner.');
    } finally {
      setPendingMemberId(undefined);
    }
  }

  async function remove(teamMember: TeamMember) {
    setPendingMemberId(teamMember.membershipId);
    setError(undefined);
    try {
      await removeTeamMember({ data: { teamId, membershipId: teamMember.membershipId } });
      await router.invalidate();
    } catch {
      setError('The member could not be removed. A team must always keep at least one owner.');
    } finally {
      setPendingMemberId(undefined);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardDescription>
          {members.length} {members.length === 1 ? 'member' : 'members'} in this team.
        </CardDescription>
      </CardHeader>
      <CardContent className='grid gap-3'>
        {members.map((member) => (
          <div className='bg-muted/55 flex items-center gap-3 rounded-lg p-3' key={member.id}>
            <span className='bg-background flex size-9 items-center justify-center rounded-xl'>
              <UserRound className='size-4' aria-hidden='true' />
            </span>
            <div className='min-w-0'>
              <p className='truncate font-medium'>{member.name}</p>
              <p className='text-muted-foreground truncate text-sm'>{member.email}</p>
              <p className='text-muted-foreground truncate text-xs'>{member.role === 'owner' ? 'Owner' : 'Member'}</p>
            </div>
            {viewerRole === 'owner' && (
              <div className='ml-auto flex items-center gap-2'>
                <select
                  aria-label={`Role for ${member.name}`}
                  className='bg-background h-9 rounded-lg border px-2 text-sm'
                  disabled={pendingMemberId === member.membershipId}
                  onChange={(event) => changeRole(member, event.target.value as 'owner' | 'member')}
                  value={member.role}
                >
                  <option value='owner'>Owner</option>
                  <option value='member'>Member</option>
                </select>
                <Button
                  aria-label={`Remove ${member.name}`}
                  disabled={pendingMemberId === member.membershipId}
                  onClick={() => remove(member)}
                  size='icon-sm'
                  variant='ghost'
                >
                  {pendingMemberId === member.membershipId ? (
                    <LoaderCircle className='animate-spin' aria-hidden='true' />
                  ) : (
                    <X aria-hidden='true' />
                  )}
                </Button>
              </div>
            )}
          </div>
        ))}
        {error && (
          <p className='text-destructive text-sm' role='alert'>
            {error}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
