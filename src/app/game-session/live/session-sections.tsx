import { ArrowLeft, Copy, Dices, LoaderCircle, Play, Radio, Square, Trash2, Trophy } from 'lucide-react';

import { PageShell } from '#/app/shell/page-container';
import { Button } from '#/shared/ui/button';
import { ButtonLink } from '#/shared/ui/button-link';
import { Card, CardContent } from '#/shared/ui/card';

import { BingoCard, BingoConfetti } from '../bingo/bingo-card';
import { LiveChat } from './live-chat';
import { LiveScoreboard } from './live-scoreboard';
import { useGameSessionStore } from './store';

type SessionStatus = 'active' | 'created' | 'ended';

export function GameSessionLayout({ children }: { children: React.ReactNode }) {
  return <PageShell className='min-h-screen py-5'>{children}</PageShell>;
}

export function SessionBackLink({ teamId }: { teamId: string }) {
  return (
    <ButtonLink className='mb-8' params={{ teamId }} size='sm' to='/teams/$teamId' variant='ghost'>
      <ArrowLeft aria-hidden='true' />
      Back to team
    </ButtonLink>
  );
}

export function SessionHeader() {
  const session = useGameSessionStore((state) => state.session);
  if (!session) {
    return null;
  }
  return (
    <header className='flex flex-wrap items-end justify-between gap-4'>
      <SessionHeading session={session} />
      <SessionActions sessionStatus={session.status} />
    </header>
  );
}

function SessionHeading({
  session,
}: {
  session: NonNullable<ReturnType<typeof useGameSessionStore.getState>['session']>;
}) {
  const connected = useGameSessionStore((state) => state.connected);
  const active = session.status === 'active';
  return (
    <div>
      <p className='text-primary text-sm font-medium'>{session.teamName}</p>
      <h1 className='mt-1 flex items-center gap-2 text-3xl font-semibold tracking-tight sm:text-4xl'>
        <Radio className={`size-8 ${active ? 'text-primary animate-pulse' : ''}`} aria-hidden='true' />
        {getSessionTitle(session.status)}
      </h1>
      <p className='text-muted-foreground mt-2 text-sm'>{getSessionDescription(session.status, connected)}</p>
    </div>
  );
}

function SessionActions({ sessionStatus }: { sessionStatus: SessionStatus }) {
  const canDelete = useGameSessionStore((state) => state.canDelete);
  const createShareLink = useGameSessionStore((state) => state.createShareLink);
  const deleteSession = useGameSessionStore((state) => state.deleteSession);
  const isPending = useGameSessionStore((state) => state.isPending);
  const requestEnd = useGameSessionStore((state) => state.requestEnd);
  const startSession = useGameSessionStore((state) => state.startSession);
  return (
    <div className='flex flex-wrap gap-2'>
      {sessionStatus === 'created' && (
        <Button disabled={Boolean(isPending)} onClick={() => void startSession()}>
          {isPending === 'start' ? (
            <LoaderCircle className='animate-spin' aria-hidden='true' />
          ) : (
            <Play aria-hidden='true' />
          )}
          Start session
        </Button>
      )}
      {sessionStatus !== 'ended' && (
        <Button disabled={Boolean(isPending)} onClick={() => void createShareLink()} variant='outline'>
          {isPending === 'link' ? (
            <LoaderCircle className='animate-spin' aria-hidden='true' />
          ) : (
            <Copy aria-hidden='true' />
          )}
          Invitation link
        </Button>
      )}
      {sessionStatus === 'active' && (
        <Button disabled={Boolean(isPending)} onClick={requestEnd} variant='destructive'>
          {isPending === 'end' ? (
            <LoaderCircle className='animate-spin' aria-hidden='true' />
          ) : (
            <Square aria-hidden='true' />
          )}
          End session
        </Button>
      )}
      {sessionStatus !== 'ended' && (
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
  );
}

export function SessionShareLink() {
  const shareLink = useGameSessionStore((state) => state.shareLink);
  if (!shareLink) {
    return null;
  }
  return (
    <Card className='border-primary/30 bg-primary/5'>
      <CardContent className='flex flex-col gap-3 py-4 sm:flex-row sm:items-center'>
        <p className='min-w-0 flex-1 text-sm break-all'>{shareLink}</p>
        <Button
          onClick={() => void navigator.clipboard?.writeText(shareLink)}
          size='sm'
          type='button'
          variant='outline'
        >
          <Copy aria-hidden='true' /> Copy
        </Button>
      </CardContent>
    </Card>
  );
}

export function SessionCelebration() {
  const celebration = useGameSessionStore((state) => state.celebration);
  return celebration > 0 ? <BingoConfetti key={celebration} /> : null;
}

export function ActiveSession() {
  return (
    <div className='grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]'>
      <SessionBoard />
      <SessionSidebar />
    </div>
  );
}

function SessionBoard() {
  const card = useGameSessionStore((state) => state.card);
  const isPending = useGameSessionStore((state) => state.isPending);
  const pendingCell = useGameSessionStore((state) => state.pendingCell);
  const resetCard = useGameSessionStore((state) => state.resetCard);
  const toggleCardCell = useGameSessionStore((state) => state.toggleCardCell);
  return (
    <BingoCard
      card={card}
      disabled={Boolean(isPending)}
      onReset={(cardId) => void resetCard(cardId)}
      onToggle={(cardId, position) => void toggleCardCell(cardId, position)}
      pendingCell={pendingCell}
      resetting={isPending === 'reset'}
    />
  );
}

function SessionSidebar() {
  return (
    <aside className='grid gap-5'>
      <SessionScoreboard />
      <SessionChat />
    </aside>
  );
}

function SessionScoreboard() {
  const participants = useGameSessionStore((state) => state.participants);
  const scores = useGameSessionStore((state) => state.scores);
  return <LiveScoreboard participants={participants} scores={scores} />;
}

function SessionChat() {
  const connected = useGameSessionStore((state) => state.connected);
  const messages = useGameSessionStore((state) => state.messages);
  const sendChat = useGameSessionStore((state) => state.sendChat);
  const viewerUserId = useGameSessionStore((state) => state.viewerUserId);
  if (!viewerUserId) {
    return null;
  }
  return <LiveChat connected={connected} messages={messages} onSend={sendChat} viewerUserId={viewerUserId} />;
}

export function SessionLobby() {
  const participants = useGameSessionStore((state) => state.participants);
  return (
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
  );
}

export function SessionEnded() {
  const endedBy = useGameSessionStore((state) => state.endedBy);
  return (
    <Card className='border-dashed'>
      <CardContent className='py-10 text-center'>
        <Trophy className='text-primary mx-auto mb-3 size-10' aria-hidden='true' />
        <h2 className='font-semibold'>Thanks for playing</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          {endedBy ? `${endedBy} ended this session. ` : ''}This session is closed and can no longer be joined or
          changed.
        </p>
      </CardContent>
    </Card>
  );
}

export function EndSessionDialog() {
  const closeEndDialog = useGameSessionStore((state) => state.closeEndDialog);
  const endDialogOpen = useGameSessionStore((state) => state.endDialogOpen);
  const endSession = useGameSessionStore((state) => state.endSession);
  const pending = useGameSessionStore((state) => state.isPending === 'end');
  if (!endDialogOpen) {
    return null;
  }
  return (
    <dialog
      aria-describedby='end-session-description'
      aria-labelledby='end-session-title'
      className='m-auto w-[calc(100%-2rem)] max-w-lg border-0 bg-transparent p-0 [&::backdrop]:bg-black/60 [&::backdrop]:backdrop-blur-sm'
      onCancel={(event) => {
        if (pending) {
          event.preventDefault();
        } else {
          closeEndDialog();
        }
      }}
      open
    >
      <div className='bg-background text-foreground rounded-xl border p-6 shadow-2xl'>
        <h2 className='text-xl font-semibold' id='end-session-title'>
          End bingo session?
        </h2>
        <p className='text-muted-foreground mt-2 text-sm leading-6' id='end-session-description'>
          Everyone currently in the session will see that you ended the game. No more cards can be changed.
        </p>
        <div className='mt-6 flex justify-end gap-3'>
          <Button disabled={pending} onClick={closeEndDialog} type='button' variant='outline'>
            Cancel
          </Button>
          <Button disabled={pending} onClick={() => void endSession()} type='button' variant='destructive'>
            {pending && <LoaderCircle className='animate-spin' aria-hidden='true' />} End session
          </Button>
        </div>
      </div>
    </dialog>
  );
}

export function SessionError() {
  const error = useGameSessionStore((state) => state.error);
  if (!error) {
    return null;
  }
  return (
    <p className='text-destructive rounded-lg border border-current/20 px-4 py-3 text-sm' role='alert'>
      {error}
    </p>
  );
}

function getSessionDescription(status: SessionStatus, connected: boolean) {
  if (status === 'created') {
    return 'This session has not started yet.';
  }
  if (status === 'ended') {
    return 'The shared game state is preserved, but no longer changeable.';
  }
  return connected ? 'Live game state is synchronised with your team.' : 'Restoring the live connection…';
}

function getSessionTitle(status: SessionStatus) {
  if (status === 'created') {
    return 'Bingo session ready';
  }
  if (status === 'ended') {
    return 'Bingo session ended';
  }
  return 'Live bingo';
}
