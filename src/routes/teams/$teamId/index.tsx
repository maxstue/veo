import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, Dices, LoaderCircle, Radio, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { AppHeader } from '#/components/app-header';
import { TeamBingoRulesPreview } from '#/components/team-bingo-rules';
import { TeamInvitationsPreview } from '#/components/team-invitations';
import { TeamLeaderboardPreview } from '#/components/team-leaderboard';
import { TeamMembersPreview } from '#/components/team-members';
import { TeamTermsPreview } from '#/components/team-terms';
import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent } from '#/components/ui/card';
import { createGameSession, deleteGameSession, listGameSessions } from '#/lib/game-sessions';
import { getTeam, getViewer } from '#/lib/teams';

export const Route = createFileRoute('/teams/$teamId/')({
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}` } });
    }
  },
  loader: async ({ params }) => {
    const [team, sessions] = await Promise.all([
      getTeam({ data: { teamId: params.teamId } }),
      listGameSessions({ data: { teamId: params.teamId } }),
    ]);
    return { ...team, sessions };
  },
  component: TeamPage,
});

function TeamPage() {
  const data = Route.useLoaderData();
  const { teamId } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string>();
  const [error, setError] = useState<string>();

  async function createSession() {
    setError(undefined);
    setIsCreating(true);
    try {
      const result = await createGameSession({ data: { teamId } });
      await router.invalidate();
      await navigate({ to: '/teams/$teamId/sessions/$sessionId', params: { teamId, sessionId: result.sessionId } });
    } catch {
      setError('The bingo session could not be created.');
      setIsCreating(false);
    }
  }

  async function deleteSession(sessionId: string) {
    if (!window.confirm('Delete this session and all of its temporary data?')) {
      return;
    }
    setError(undefined);
    setDeletingSessionId(sessionId);
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
      setDeletingSessionId(undefined);
    }
  }

  return (
    <main className='mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10'>
      <AppHeader />
      <section className='py-10 sm:py-14'>
        <ButtonLink className='mb-5' size='sm' to='/teams' variant='ghost'>
          <ArrowLeft aria-hidden='true' />
          All teams
        </ButtonLink>
        <div className='mb-8'>
          <p className='text-primary text-sm font-medium dark:text-violet-300'>Team overview</p>
          <h1 className='mt-1 text-4xl font-semibold tracking-tight'>{data.team.name}</h1>
        </div>

        <div className='grid gap-5 lg:grid-cols-2'>
          <Card className='border-primary/25 from-primary/10 via-card to-card bg-linear-to-br lg:col-span-2'>
            <CardContent className='flex flex-col gap-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex items-center gap-4'>
                <span className='bg-primary/15 flex size-12 shrink-0 items-center justify-center rounded-xl'>
                  <Dices className='text-primary size-6 dark:text-violet-300' aria-hidden='true' />
                </span>
                <div>
                  <h2 className='font-semibold'>Start a team bingo session</h2>
                  <p className='text-muted-foreground mt-1 text-sm'>
                    Invite teammates, play live, and see the score together.
                  </p>
                </div>
              </div>
              <Button
                className='shadow-primary/25 hover:shadow-primary/35 h-11 px-5 text-base shadow-lg'
                disabled={isCreating}
                onClick={() => void createSession()}
                size='lg'
              >
                {isCreating ? (
                  <LoaderCircle className='animate-spin' aria-hidden='true' />
                ) : (
                  <Dices className='size-5' aria-hidden='true' />
                )}
                New session
              </Button>
            </CardContent>
          </Card>

          {data.sessions.length > 0 && (
            <Card className='lg:col-span-2'>
              <CardContent className='py-5'>
                <div className='mb-3 flex items-center gap-2'>
                  <Radio className='text-primary size-5' aria-hidden='true' />
                  <h2 className='font-semibold'>Current sessions</h2>
                </div>
                <div className='grid gap-2 sm:grid-cols-2'>
                  {data.sessions.map((session) => (
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
                        className='disabled:pointer-events-auto disabled:cursor-not-allowed'
                        disabled={Boolean(deletingSessionId) || !session.canDelete}
                        onClick={() => void deleteSession(session.id)}
                        size='icon'
                        title={session.canDelete ? 'Delete session' : 'Another participant is connected'}
                        variant='outline'
                      >
                        {deletingSessionId === session.id ? (
                          <LoaderCircle className='animate-spin' aria-hidden='true' />
                        ) : (
                          <Trash2 aria-hidden='true' />
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <TeamMembersPreview members={data.members} teamId={teamId} />
          <TeamTermsPreview teamId={teamId} terms={data.terms} />
          <TeamBingoRulesPreview presets={data.bingoRulesPresets} rules={data.team.bingoRules} teamId={teamId} />
          <TeamLeaderboardPreview leaderboard={data.leaderboard} teamId={teamId} />
          <TeamInvitationsPreview invitations={data.invitations} teamId={teamId} />
        </div>
        {error && (
          <p className='text-destructive mt-5 text-sm' role='alert'>
            {error}
          </p>
        )}
      </section>
    </main>
  );
}
