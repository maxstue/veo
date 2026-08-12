import { useNavigate, useRouter } from '@tanstack/react-router';
import { useEffect, useLayoutEffect, useMemo } from 'react';

import { useGameSessionSocket } from '#/app/game-session/live/use-game-session-socket';

import { getGameSession } from '../api';
import { getBingoGame } from '../bingo/bingo-cards';
import { useGameSessionStore } from './store';

function useGameSession({
  game,
  sessionData,
  sessionId,
  teamId,
}: {
  game: Awaited<ReturnType<typeof getBingoGame>> | null;
  sessionData: Awaited<ReturnType<typeof getGameSession>>;
  sessionId: string;
  teamId: string;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const { connected, sendChat } = useGameSessionSocket(sessionData.session.status !== 'ended' ? sessionId : undefined, {
    onCardUpdate(card) {
      useGameSessionStore.getState().receiveCard(sessionId, card);
    },
    onMessages(messages) {
      useGameSessionStore.getState().receiveMessages(sessionId, messages);
    },
    onParticipants(participants) {
      useGameSessionStore.getState().receiveParticipants(sessionId, participants);
    },
    onScoreUpdate(score) {
      useGameSessionStore.getState().receiveScore(sessionId, score);
    },
    onScores(scores) {
      useGameSessionStore.getState().receiveScores(sessionId, scores);
    },
    onSessionStarted() {
      void router.invalidate();
    },
    onSessionEnded(endedBy) {
      useGameSessionStore.getState().setEndedBy(sessionId, endedBy);
      void router.invalidate();
    },
    onSessionDeleted() {
      void navigate({ to: '/teams/$teamId', params: { teamId } });
    },
  });

  const runtime = useMemo(
    () => ({
      invalidate: () => router.invalidate(),
      navigateToTeam: () => navigate({ to: '/teams/$teamId', params: { teamId } }),
      sendChat,
    }),
    [navigate, router, sendChat, teamId],
  );
  const input = useMemo(
    () => ({ game, runtime, sessionData, sessionId, teamId }),
    [game, runtime, sessionData, sessionId, teamId],
  );

  useLayoutEffect(() => {
    useGameSessionStore.getState().activate(input);
  }, [input]);

  useEffect(() => {
    if (sessionData.session.status === 'active') {
      void useGameSessionStore.getState().ensureCard();
    }
  }, [sessionData.session.status, sessionId]);

  useEffect(() => {
    useGameSessionStore.getState().setConnected(sessionId, connected);
  }, [connected, sessionId]);

  useEffect(
    () => () => {
      useGameSessionStore.getState().clear(sessionId);
    },
    [sessionId],
  );
}

export { useGameSession };
