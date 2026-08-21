import { useNavigate, useRouter } from '@tanstack/react-router';
import { Dices, LoaderCircle, Radio, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent } from '#/shared/ui/card';

import { createGameSession, deleteGameSession, listGameSessions } from './api';

type TeamSessionsPreviewItem = Awaited<ReturnType<typeof listGameSessions>>[number];

export function TeamSessionsPreview({ sessions, teamId }: { sessions: TeamSessionsPreviewItem[]; teamId: string }) {
  const navigate = useNavigate();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<string>();
  const [error, setError] = useState<string>();

  async function create() {
    setError(undefined);
    setCreating(true);
    try {
      const result = await createGameSession({ data: { teamId } });
      await router.invalidate();
      await navigate({ to: '/teams/$teamId/sessions/$sessionId', params: { teamId, sessionId: result.sessionId } });
    } catch {
      setError('The bingo session could not be created.');
      setCreating(false);
    }
  }

  async function remove(sessionId: string) {
    if (!window.confirm('Delete this session and all of its temporary data?')) {
      return;
    }
    setError(undefined);
    setDeleting(sessionId);
    try {
      await deleteGameSession({ data: { teamId, sessionId } });
      await router.invalidate();
    } catch (cause) {
      setError(
        cause instanceof Response && cause.status === 409
          ? 'The session cannot be deleted while another participant is connected.'
          : 'The bingo session could not be deleted.',
      );
    } finally {
      setDeleting(undefined);
    }
  }

  return (
    <>
      <Card className='border-primary/25 from-primary/10 via-card to-card bg-linear-to-br lg:col-span-2'>
        <CardContent className='flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-4'>
            <span className='bg-primary/15 flex size-12 items-center justify-center rounded-xl'>
              <Dices className='text-primary size-6' />
            </span>
            <div>
              <h2 className='font-semibold'>Start a team bingo session</h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                Invite teammates, play live, and see the score together.
              </p>
            </div>
          </div>
          <Button disabled={creating} onClick={() => void create()} size='lg'>
            {creating ? <LoaderCircle className='animate-spin' /> : <Dices />} New session
          </Button>
        </CardContent>
      </Card>
      {sessions.length > 0 && (
        <Card className='lg:col-span-2'>
          <CardContent className='py-5'>
            <div className='mb-3 flex items-center gap-2'>
              <Radio className='text-primary size-5' />
              <h2 className='font-semibold'>Current sessions</h2>
            </div>
            <div className='grid gap-2 sm:grid-cols-2'>
              {sessions.map((session) => (
                <div className='flex gap-2' key={session.id}>
                  <ButtonLink
                    className='min-w-0 flex-1 justify-between'
                    params={{ sessionId: session.id, teamId }}
                    to='/teams/$teamId/sessions/$sessionId'
                    variant='outline'
                  >
                    <span>{session.status === 'active' ? 'Live bingo' : 'Waiting to start'}</span>
                    <span className='text-muted-foreground text-xs'>
                      {session.status === 'active' ? 'Join' : 'Open'}
                    </span>
                  </ButtonLink>
                  <Button
                    aria-label='Delete session'
                    disabled={Boolean(deleting) || !session.canDelete}
                    onClick={() => void remove(session.id)}
                    size='icon'
                    variant='outline'
                  >
                    {deleting === session.id ? <LoaderCircle className='animate-spin' /> : <Trash2 />}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {error && (
        <p className='text-destructive text-sm lg:col-span-2' role='alert'>
          {error}
        </p>
      )}
    </>
  );
}
