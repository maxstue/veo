import { createFileRoute, redirect } from '@tanstack/react-router';

import { getGameSession } from '#/app/game-session/api';
import { getBingoGame } from '#/app/game-session/bingo/bingo-cards';
import {
  ActiveSession,
  EndSessionDialog,
  GameSessionLayout,
  SessionBackLink,
  SessionCelebration,
  SessionEnded,
  SessionError,
  SessionHeader,
  SessionLobby,
  SessionShareLink,
} from '#/app/game-session/live/session-sections';
import { useGameSession } from '#/app/game-session/live/use-game-session';
import { getViewer } from '#/app/teams/api';

export const Route = createFileRoute('/teams/$teamId/sessions/$sessionId')({
  ssr: 'data-only',
  beforeLoad: async ({ params }) => {
    if (!(await getViewer())) {
      throw redirect({ to: '/auth', search: { returnTo: `/teams/${params.teamId}/sessions/${params.sessionId}` } });
    }
  },
  loader: async ({ params }) => {
    const sessionData = await getGameSession({ data: { teamId: params.teamId, sessionId: params.sessionId } });
    const game =
      sessionData.session.status === 'active'
        ? await getBingoGame({ data: { teamId: params.teamId, sessionId: params.sessionId } })
        : null;
    return { game, sessionData };
  },
  component: GameSessionRoute,
});

function GameSessionRoute() {
  const { game, sessionData } = Route.useLoaderData();
  const { sessionId, teamId } = Route.useParams();
  useGameSession({ game, sessionData, sessionId, teamId });
  return (
    <GameSessionLayout>
      <SessionBackLink teamId={teamId} />
      <SessionCelebration />
      <section className='space-y-5 pb-10'>
        <SessionHeader />
        <SessionShareLink />
        {sessionData.session.status === 'active' && game && <ActiveSession />}
        {sessionData.session.status === 'created' && <SessionLobby />}
        {sessionData.session.status === 'ended' && <SessionEnded />}
        <EndSessionDialog />
        <SessionError />
      </section>
    </GameSessionLayout>
  );
}
