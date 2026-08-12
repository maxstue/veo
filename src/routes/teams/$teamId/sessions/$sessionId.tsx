import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router';
import {
  ArrowLeft,
  Copy,
  Dices,
  LoaderCircle,
  MessageCircle,
  Play,
  Radio,
  Square,
  Trash2,
  Trophy,
  Users,
} from 'lucide-react';
import {
  type CSSProperties,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';

import { Button } from '#/components/ui/button';
import { ButtonLink } from '#/components/ui/button-link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/components/ui/card';
import { createBingoCard, getBingoGame, resetBingoCard, toggleBingoCell } from '#/lib/bingo-cards';
import { hasBingo } from '#/lib/bingo-game';
import { playBingoWinSound } from '#/lib/bingo-win-sound';
import type {
  GameSessionCard,
  GameSessionChatMessage,
  GameSessionLiveEvent,
  GameSessionParticipant,
  GameSessionScore,
} from '#/lib/game-session-live';
import {
  deleteGameSession,
  endGameSession,
  getGameSession,
  rotateGameSessionInvitation,
  startGameSession,
} from '#/lib/game-sessions';
import { getViewer } from '#/lib/teams';

type ClientGameSessionScore = Omit<GameSessionScore, 'completedAt'> & { completedAt: Date | null };

export const Route = createFileRoute('/teams/$teamId/sessions/$sessionId')({
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
  component: GameSessionPage,
});

function GameSessionPage() {
  const { game, sessionData } = Route.useLoaderData();
  const { sessionId, teamId } = Route.useParams();
  const navigate = useNavigate();
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [isPending, setIsPending] = useState<string>();
  const [pendingCell, setPendingCell] = useState<number>();
  const [shareLink, setShareLink] = useState<string>();
  const [celebration, setCelebration] = useState(0);
  const [messages, setMessages] = useState<GameSessionChatMessage[]>([]);
  const [participants, setParticipants] = useState<GameSessionParticipant[]>([]);
  const [presenceKnown, setPresenceKnown] = useState(false);
  const [liveCard, setLiveCard] = useState<ReturnType<typeof normalizeLiveCard> | null>();
  const [liveScores, setLiveScores] = useState<typeof sessionData.cards>();
  const card = liveCard === undefined ? (game?.card ?? null) : liveCard;
  const scores = liveScores ?? sessionData.cards;
  const canDelete = presenceKnown
    ? participants.every((participant) => participant.userId === sessionData.viewerUserId)
    : sessionData.canDelete;
  const autoCardRequested = useRef(false);
  const socket = useGameSessionSocket(sessionData.session.status !== 'ended' ? sessionId : undefined, {
    onCardUpdate(card) {
      setLiveCard(normalizeLiveCard(card));
    },
    onMessages: setMessages,
    onParticipants(nextParticipants) {
      setParticipants(nextParticipants);
      setPresenceKnown(true);
    },
    onScoreUpdate(score) {
      setLiveScores((current) => mergeScore(current ?? sessionData.cards, score));
    },
    onScores(nextScores) {
      setLiveScores(nextScores.map(normalizeLiveScore));
    },
    onSessionStarted() {
      void router.invalidate();
    },
    onSessionEnded() {
      void router.invalidate();
    },
    onSessionDeleted() {
      void navigate({ to: '/teams/$teamId', params: { teamId } });
    },
  });

  useEffect(() => {
    if (sessionData.session.status !== 'active' || !game || card || autoCardRequested.current) {
      return;
    }

    autoCardRequested.current = true;
    setError(undefined);
    setIsPending('card');
    void createBingoCard({ data: { teamId, sessionId } })
      .then(async (result) => {
        if (result.status === 'insufficient-terms') {
          setError(`${result.required - result.available} more bingo terms are needed to play.`);
          return;
        }
        if (!('card' in result) || !result.card) {
          throw new Error('Session card response missing card state');
        }
        setLiveCard(result.card);
      })
      .catch(() => {
        autoCardRequested.current = false;
        setError('Your card could not be created.');
      })
      .finally(() => setIsPending(undefined));
  }, [card, game, sessionData.session.status, sessionId, teamId]);

  async function start() {
    setError(undefined);
    setIsPending('start');
    try {
      await startGameSession({ data: { teamId, sessionId } });
      await router.invalidate();
    } catch {
      setError('The session could not be started.');
    } finally {
      setIsPending(undefined);
    }
  }

  async function end() {
    if (!window.confirm('End this bingo session for everyone?')) {
      return;
    }
    setError(undefined);
    setIsPending('end');
    try {
      await endGameSession({ data: { teamId, sessionId } });
      await router.invalidate();
    } catch {
      setError('The session could not be ended.');
    } finally {
      setIsPending(undefined);
    }
  }

  async function deleteSession() {
    if (!window.confirm('Delete this session and all of its temporary data?')) {
      return;
    }
    setError(undefined);
    setIsPending('delete');
    try {
      await deleteGameSession({ data: { teamId, sessionId } });
      await navigate({ to: '/teams/$teamId', params: { teamId } });
    } catch (cause) {
      setError(
        cause instanceof Response && cause.status === 409
          ? 'The session cannot be deleted while another participant is connected.'
          : 'The session could not be deleted.',
      );
      setIsPending(undefined);
    }
  }

  async function createShareLink() {
    setError(undefined);
    setIsPending('link');
    try {
      const { token } = await rotateGameSessionInvitation({ data: { teamId, sessionId } });
      const link = `${window.location.origin}/sessions/join/${token}`;
      setShareLink(link);
      await navigator.clipboard?.writeText(link);
    } catch {
      setError('The invitation link could not be created.');
    } finally {
      setIsPending(undefined);
    }
  }

  async function toggle(cardId: string, position: number) {
    if (!game || !card || card.id !== cardId || pendingCell !== undefined) {
      return;
    }
    setError(undefined);
    setPendingCell(position);
    const selectedCell = card.cells.find((cell) => cell.position === position);
    const markedPositions = card.cells
      .filter((cell) => (cell.position === position ? !selectedCell?.marked : cell.marked))
      .map((cell) => cell.position);
    const winsWithThisMark = !selectedCell?.marked && !card.bingo && hasBingo(markedPositions, card.rules);
    if (winsWithThisMark && game.winnerSoundConfig) {
      playBingoWinSound(game.winnerSoundConfig);
    }
    try {
      const result = await toggleBingoCell({ data: { teamId, sessionId, cardId, position } });
      if (!('card' in result) || !result.card) {
        throw new Error('Session card response missing card state');
      }
      setLiveCard(result.card);
      if (result.card.bingo && !card.bingo) {
        setCelebration((value) => value + 1);
      }
    } catch {
      setError('The mark could not be saved.');
    } finally {
      setPendingCell(undefined);
    }
  }

  async function reset(cardId: string) {
    if (!window.confirm('Clear all marks on your card?')) {
      return;
    }
    setError(undefined);
    setIsPending('reset');
    try {
      const result = await resetBingoCard({ data: { teamId, sessionId, cardId } });
      if (!('card' in result) || !result.card) {
        throw new Error('Session card response missing card state');
      }
      setLiveCard(result.card);
    } catch {
      setError('The marks could not be cleared.');
    } finally {
      setIsPending(undefined);
    }
  }

  const { session } = sessionData;
  const active = session.status === 'active';

  return (
    <main className='mx-auto min-h-screen max-w-6xl px-5 py-5 sm:px-8 lg:px-10'>
      {celebration > 0 && <Confetti key={celebration} />}

      <ButtonLink className='mb-8' params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
        <ArrowLeft aria-hidden='true' />
        Back to team
      </ButtonLink>

      <section className='space-y-5 pb-10'>
        <header className='flex flex-wrap items-end justify-between gap-4'>
          <div>
            <p className='text-primary text-sm font-medium'>{session.teamName}</p>
            <h1 className='mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl'>
              <Radio className={`size-8 ${active ? 'text-primary animate-pulse' : ''}`} aria-hidden='true' />
              {session.status === 'created'
                ? 'Bingo session ready'
                : session.status === 'ended'
                  ? 'Bingo session ended'
                  : 'Live bingo'}
            </h1>
            <p className='text-muted-foreground mt-2 text-sm'>
              {getSessionDescription(session.status, socket.connected)}
            </p>
          </div>
          <div className='flex flex-wrap gap-2'>
            {session.status === 'created' && (
              <Button disabled={Boolean(isPending)} onClick={() => void start()}>
                {isPending === 'start' ? (
                  <LoaderCircle className='animate-spin' aria-hidden='true' />
                ) : (
                  <Play aria-hidden='true' />
                )}
                Start session
              </Button>
            )}
            {session.status !== 'ended' && (
              <Button disabled={Boolean(isPending)} onClick={() => void createShareLink()} variant='outline'>
                {isPending === 'link' ? (
                  <LoaderCircle className='animate-spin' aria-hidden='true' />
                ) : (
                  <Copy aria-hidden='true' />
                )}
                Invitation link
              </Button>
            )}
            {active && (
              <Button disabled={Boolean(isPending)} onClick={() => void end()} variant='destructive'>
                {isPending === 'end' ? (
                  <LoaderCircle className='animate-spin' aria-hidden='true' />
                ) : (
                  <Square aria-hidden='true' />
                )}
                End session
              </Button>
            )}
            {session.status !== 'ended' && (
              <Button
                className='disabled:pointer-events-auto disabled:cursor-not-allowed'
                disabled={Boolean(isPending) || !canDelete}
                onClick={() => void deleteSession()}
                title={canDelete ? 'Delete session' : 'Another participant is connected'}
                variant='outline'
              >
                {isPending === 'delete' ? (
                  <LoaderCircle className='animate-spin' aria-hidden='true' />
                ) : (
                  <Trash2 aria-hidden='true' />
                )}
                Delete session
              </Button>
            )}
          </div>
        </header>

        {shareLink && (
          <Card className='border-primary/30 bg-primary/5'>
            <CardContent className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center'>
              <p className='min-w-0 flex-1 text-sm break-all'>{shareLink}</p>
              <Button
                onClick={() => void navigator.clipboard?.writeText(shareLink)}
                size='sm'
                type='button'
                variant='outline'
              >
                <Copy aria-hidden='true' />
                Copy
              </Button>
            </CardContent>
          </Card>
        )}

        {active && game && (
          <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]'>
            <Card className={card?.bingo ? 'border-primary shadow-primary/15 shadow-xl' : undefined}>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  {card?.bingo ? <Trophy className='text-primary' aria-hidden='true' /> : <Dices aria-hidden='true' />}
                  {card?.bingo ? 'Bingo!' : 'Your bingo card'}
                </CardTitle>
                <CardDescription>
                  {card
                    ? 'Mark a term when it comes up in the meeting.'
                    : 'Create your personal card to join the game.'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {card ? (
                  <>
                    <div
                      aria-label='Bingo card'
                      className='grid gap-2'
                      role='group'
                      style={{ gridTemplateColumns: `repeat(${card.rules.boardSize}, minmax(0, 1fr))` }}
                    >
                      {card.cells.map((cell) => {
                        const marked = cell.marked;
                        return (
                          <button
                            aria-label={`${cell.labelSnapshot}${marked ? ', marked' : ', not marked'}`}
                            aria-pressed={marked}
                            className={`aspect-square min-w-0 rounded-lg border p-1 text-[0.62rem] leading-tight font-medium transition sm:p-3 sm:text-sm ${
                              marked
                                ? 'border-primary bg-primary text-primary-foreground scale-[0.97] shadow-md'
                                : 'bg-background hover:border-primary/50 hover:bg-primary/5'
                            }`}
                            disabled={pendingCell !== undefined || Boolean(isPending)}
                            key={cell.position}
                            onClick={() => void toggle(card.id, cell.position)}
                            type='button'
                          >
                            <span className='line-clamp-4'>{cell.labelSnapshot}</span>
                          </button>
                        );
                      })}
                    </div>
                    <Button
                      className='mt-4'
                      disabled={Boolean(isPending)}
                      onClick={() => void reset(card.id)}
                      variant='outline'
                    >
                      {isPending === 'reset' && <LoaderCircle className='animate-spin' aria-hidden='true' />}
                      Clear marks
                    </Button>
                  </>
                ) : (
                  <div className='text-muted-foreground flex items-center gap-2 text-sm' role='status'>
                    <LoaderCircle className='size-4 animate-spin' aria-hidden='true' />
                    Preparing your card…
                  </div>
                )}
              </CardContent>
            </Card>

            <aside className='grid gap-5'>
              <LiveScoreboard participants={participants} scores={scores} />
              <LiveChat
                connected={socket.connected}
                messages={messages}
                onSend={(content) => socket.sendChat(content)}
              />
            </aside>
          </div>
        )}

        {session.status === 'created' && (
          <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]'>
            <Card className='border-dashed'>
              <CardContent className='py-10 text-center'>
                <Dices className='text-primary mx-auto mb-3 size-10' aria-hidden='true' />
                <h2 className='font-semibold'>Ready when your team is</h2>
                <p className='text-muted-foreground mt-1 text-sm'>
                  Create an invitation link, then start the session when everyone is ready.
                </p>
              </CardContent>
            </Card>
            <aside>
              <LiveScoreboard participants={participants} scores={[]} />
            </aside>
          </div>
        )}

        {session.status === 'ended' && (
          <Card className='border-dashed'>
            <CardContent className='py-10 text-center'>
              <Trophy className='text-primary mx-auto mb-3 size-10' aria-hidden='true' />
              <h2 className='font-semibold'>Thanks for playing</h2>
              <p className='text-muted-foreground mt-1 text-sm'>
                This session is closed and can no longer be joined or changed.
              </p>
            </CardContent>
          </Card>
        )}

        {error && (
          <p className='text-destructive rounded-lg border border-current/20 px-4 py-3 text-sm' role='alert'>
            {error}
          </p>
        )}
      </section>
    </main>
  );
}

function LiveScoreboard({
  participants,
  scores,
}: {
  participants: GameSessionParticipant[];
  scores: Array<{
    bingo: boolean;
    boardSize: number;
    completedAt: Date | null;
    longestLine: number;
    userId: string;
    userName: string;
  }>;
}) {
  const sortedScores = [...scores].sort((left, right) => {
    if (left.completedAt && right.completedAt) {
      return left.completedAt.getTime() - right.completedAt.getTime();
    }
    if (left.completedAt) {
      return -1;
    }
    if (right.completedAt) {
      return 1;
    }
    return right.longestLine - left.longestLine || left.userName.localeCompare(right.userName);
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <Users className='size-4' aria-hidden='true' />
          Live score
        </CardTitle>
        <CardDescription>{participants.length} online</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedScores.length ? (
          <ol className='space-y-2 text-sm'>
            {sortedScores.map((score, index) => (
              <li className='flex items-center justify-between gap-2' key={score.userId}>
                <span className='truncate'>
                  {index + 1}. {score.userName}
                </span>
                <span className='flex shrink-0 items-center gap-1.5 font-medium'>
                  {score.longestLine} / {score.boardSize}
                  {score.completedAt && <Trophy className='text-primary size-4' aria-label='Bingo' />}
                </span>
              </li>
            ))}
          </ol>
        ) : (
          <p className='text-muted-foreground text-sm'>No cards yet.</p>
        )}
        {participants.length > 0 && (
          <p className='text-muted-foreground mt-4 text-xs'>
            {participants.map((participant) => participant.userName).join(', ')}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function LiveChat({
  connected,
  messages,
  onSend,
}: {
  connected: boolean;
  messages: GameSessionChatMessage[];
  onSend: (content: string) => boolean;
}) {
  const [content, setContent] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (onSend(content)) {
      setContent('');
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-base'>
          <MessageCircle className='size-4' aria-hidden='true' />
          Session chat
        </CardTitle>
        <CardDescription>{connected ? 'Connected' : 'Reconnecting…'}</CardDescription>
      </CardHeader>
      <CardContent className='space-y-3'>
        <div aria-live='polite' className='max-h-52 space-y-2 overflow-y-auto text-sm'>
          {messages.length ? (
            messages.map((message) => (
              <p key={message.id}>
                <span className='font-medium'>{message.userName}: </span>
                {message.content}
              </p>
            ))
          ) : (
            <p className='text-muted-foreground'>No messages yet.</p>
          )}
        </div>
        <form className='flex gap-2' onSubmit={submit}>
          <label className='sr-only' htmlFor='session-chat-message'>
            Message
          </label>
          <input
            className='bg-background min-w-0 flex-1 rounded-lg border px-3 text-sm'
            disabled={!connected}
            id='session-chat-message'
            maxLength={800}
            onChange={(event) => setContent(event.target.value)}
            placeholder='Say something…'
            value={content}
          />
          <Button disabled={!connected || !content.trim()} size='sm' type='submit'>
            Send
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function useGameSessionSocket(
  sessionId: string | undefined,
  handlers: {
    onCardUpdate: (card: GameSessionCard) => void;
    onMessages: Dispatch<SetStateAction<GameSessionChatMessage[]>>;
    onParticipants: (participants: GameSessionParticipant[]) => void;
    onScoreUpdate: (score: GameSessionScore) => void;
    onScores: (scores: GameSessionScore[]) => void;
    onSessionStarted: () => void;
    onSessionEnded: () => void;
    onSessionDeleted: () => void;
  },
) {
  const socket = useRef<WebSocket | null>(null);
  const handlersRef = useRef(handlers);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    handlersRef.current = handlers;
  }, [handlers]);

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    let disposed = false;
    let initialConnect: ReturnType<typeof setTimeout> | undefined;
    let reconnect: ReturnType<typeof setTimeout> | undefined;
    const connect = () => {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const connection = new WebSocket(`${protocol}//${window.location.host}/api/sessions/${sessionId}/socket`);
      socket.current = connection;
      connection.addEventListener('open', () => setConnected(true));
      connection.addEventListener('message', (event) => {
        const message = parseLiveEvent(event.data);
        if (!message) {
          return;
        }
        if (message.type === 'snapshot') {
          if (message.card) {
            handlersRef.current.onCardUpdate(message.card);
          }
          handlersRef.current.onMessages(message.messages);
          handlersRef.current.onParticipants(message.participants);
          handlersRef.current.onScores(message.scores);
        } else if (message.type === 'presence') {
          handlersRef.current.onParticipants(message.participants);
        } else if (message.type === 'chat-message') {
          handlersRef.current.onMessages((current) => [...current, message.message].slice(-100));
        } else if (message.type === 'card-updated') {
          handlersRef.current.onCardUpdate(message.card);
        } else if (message.type === 'score-updated') {
          handlersRef.current.onScoreUpdate(message.score);
        } else if (message.type === 'session-started') {
          handlersRef.current.onSessionStarted();
        } else if (message.type === 'session-ended') {
          handlersRef.current.onSessionEnded();
        } else if (message.type === 'session-deleted') {
          disposed = true;
          handlersRef.current.onSessionDeleted();
        }
      });
      connection.addEventListener('close', () => {
        setConnected(false);
        if (!disposed) {
          reconnect = setTimeout(connect, 1_000);
        }
      });
      connection.addEventListener('error', () => connection.close());
    };

    initialConnect = setTimeout(connect, 0);
    return () => {
      disposed = true;
      if (initialConnect) {
        clearTimeout(initialConnect);
      }
      if (reconnect) {
        clearTimeout(reconnect);
      }
      const connection = socket.current;
      if (connection?.readyState === WebSocket.CONNECTING) {
        connection.addEventListener('open', () => connection.close(), { once: true });
      } else {
        connection?.close();
      }
      socket.current = null;
    };
  }, [sessionId]);

  return {
    connected,
    sendChat(content: string) {
      if (socket.current?.readyState !== WebSocket.OPEN || !content.trim()) {
        return false;
      }
      socket.current.send(JSON.stringify({ type: 'chat', content }));
      return true;
    },
  };
}

function parseLiveEvent(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }
  try {
    const event: unknown = JSON.parse(value);
    return event && typeof event === 'object' && typeof (event as { type?: unknown }).type === 'string'
      ? (event as GameSessionLiveEvent)
      : null;
  } catch {
    return null;
  }
}

function mergeScore(scores: ClientGameSessionScore[], score: GameSessionScore) {
  return [...scores.filter((candidate) => candidate.userId !== score.userId), normalizeLiveScore(score)];
}

function normalizeLiveScore(score: GameSessionScore) {
  return { ...score, completedAt: score.completedAt ? new Date(score.completedAt) : null };
}

function normalizeLiveCard(card: GameSessionCard) {
  return {
    ...card,
    completedAt: card.completedAt ? new Date(card.completedAt) : null,
    createdAt: new Date(card.createdAt),
  };
}

const confettiColors = ['#7c3aed', '#ec4899', '#f59e0b', '#10b981', '#3b82f6'];

function Confetti() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none fixed inset-0 z-50 overflow-hidden'
      data-testid='bingo-confetti'
    >
      {Array.from({ length: 70 }, (_, index) => {
        const style = {
          '--confetti-color': confettiColors[index % confettiColors.length],
          '--confetti-delay': `${(index % 14) * 0.035}s`,
          '--confetti-drift': `${((index * 53) % 41) - 20}vw`,
          '--confetti-duration': `${2.6 + (index % 7) * 0.18}s`,
          '--confetti-left': `${(index * 37) % 100}%`,
          '--confetti-spin': `${360 + (index % 5) * 180}deg`,
        } as CSSProperties;

        return <i className='veo-confetti' key={index} style={style} />;
      })}
    </div>
  );
}

function getSessionDescription(status: 'active' | 'created' | 'ended', connected: boolean) {
  if (status === 'created') {
    return 'This session has not started yet.';
  }
  if (status === 'ended') {
    return 'The shared game state is preserved, but no longer changeable.';
  }
  return connected ? 'Live game state is synchronised with your team.' : 'Restoring the live connection…';
}
