import { useRouter } from '@tanstack/react-router';
import { ChevronRight, LoaderCircle, UserRound, Users, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

import { removeTeamMember, updateTeamMemberRole } from './api';

export type TeamMember = { email: string; id: string; membershipId: string; name: string; role: string };

export function TeamMembersPreview({ members, teamId }: { members: TeamMember[]; teamId: string }) {
  const shownMembers = members.slice(0, 3);
  const remainingMembers = members.length - shownMembers.length;

  return (
    <Card className='flex h-full flex-col'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <Users className='text-primary size-5 dark:text-violet-300' aria-hidden='true' />
          Members
        </CardTitle>
        <CardDescription>
          {members.length} {members.length === 1 ? 'member' : 'members'} in this team.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        <ul className='grid gap-2' aria-label='Team member preview'>
          {shownMembers.map((member) => (
            <li className='bg-muted/45 flex items-center gap-3 rounded-lg p-3' key={member.id}>
              <span className='bg-background flex size-8 shrink-0 items-center justify-center rounded-xl'>
                <UserRound className='size-4' aria-hidden='true' />
              </span>
              <p className='min-w-0 truncate font-medium'>{member.name}</p>
            </li>
          ))}
        </ul>
        {remainingMembers > 0 && <p className='text-muted-foreground text-sm'>+{remainingMembers} more</p>}
        <ButtonLink className='mt-auto w-full' params={{ teamId }} to='/teams/$teamId/members' variant='outline'>
          View members
          <ChevronRight aria-hidden='true' />
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

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
