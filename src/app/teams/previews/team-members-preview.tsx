import { ChevronRight, UserRound, Users } from 'lucide-react';

import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';

type TeamMemberPreviewItem = { id: string; name: string };

export function TeamMembersPreview({ members, teamId }: { members: TeamMemberPreviewItem[]; teamId: string }) {
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
