import { LoaderCircle, MessageCircle, Send, WifiOff } from 'lucide-react';
import { type FormEventHandler, useState } from 'react';

import { Bubble, BubbleContent } from '#/shared/ui/bubble';
import { Button } from '#/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '#/shared/ui/card';
import { Message, MessageAvatar, MessageContent, MessageHeader } from '#/shared/ui/message';
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '#/shared/ui/message-scroller';

import type { GameSessionChatMessage } from './types';

function LiveChat({
  connected,
  messages,
  onSend,
  viewerUserId,
}: {
  connected: boolean;
  messages: GameSessionChatMessage[];
  onSend: (content: string) => boolean;
  viewerUserId: string;
}) {
  const [content, setContent] = useState('');

  function submit(event: Parameters<FormEventHandler<HTMLFormElement>>[0]) {
    event.preventDefault();
    if (onSend(content)) {
      setContent('');
    }
  }

  return (
    <Card className='gap-0 py-0'>
      <CardHeader className='border-b py-4'>
        <CardTitle className='flex items-center justify-between gap-3 text-base'>
          <span className='flex items-center gap-2'>
            <MessageCircle className='size-4' aria-hidden='true' />
            Session chat
          </span>
          <ConnectionStatus connected={connected} />
        </CardTitle>
        <CardDescription>Messages are visible to everyone in this session.</CardDescription>
      </CardHeader>
      <CardContent className='relative px-0'>
        <ChatTranscript connected={connected} messages={messages} viewerUserId={viewerUserId} />
        {!connected && messages.length > 0 && <ReconnectStatus />}
        <ChatComposer connected={connected} content={content} onChange={setContent} onSubmit={submit} />
      </CardContent>
    </Card>
  );
}

function ConnectionStatus({ connected }: { connected: boolean }) {
  return (
    <span
      className={`flex items-center gap-1.5 text-xs font-normal ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}
      role='status'
    >
      <span className={`size-2 rounded-full ${connected ? 'bg-emerald-500' : 'bg-muted-foreground animate-pulse'}`} />
      {connected ? 'Live' : 'Reconnecting'}
    </span>
  );
}

function ChatTranscript({
  connected,
  messages,
  viewerUserId,
}: {
  connected: boolean;
  messages: GameSessionChatMessage[];
  viewerUserId: string;
}) {
  return (
    <div className='h-72'>
      <MessageScrollerProvider autoScroll defaultScrollPosition='end'>
        <MessageScroller>
          <MessageScrollerViewport aria-label='Session messages'>
            <MessageScrollerContent className='gap-4 px-4 py-5'>
              {messages.length ? (
                messages.map((message) => (
                  <ChatMessage key={message.id} message={message} own={message.userId === viewerUserId} />
                ))
              ) : connected ? (
                <EmptyTranscript />
              ) : (
                <LoadingTranscript />
              )}
            </MessageScrollerContent>
          </MessageScrollerViewport>
          <MessageScrollerButton className='shadow-md' />
        </MessageScroller>
      </MessageScrollerProvider>
    </div>
  );
}

function ChatMessage({ message, own }: { message: GameSessionChatMessage; own: boolean }) {
  return (
    <MessageScrollerItem messageId={String(message.id)}>
      <Message align={own ? 'end' : 'start'}>
        {!own && (
          <MessageAvatar
            aria-hidden='true'
            className='text-muted-foreground size-7 min-w-7 text-[0.65rem] font-semibold uppercase'
          >
            {getInitials(message.userName)}
          </MessageAvatar>
        )}
        <MessageContent className='w-auto max-w-[82%] gap-1'>
          <MessageHeader className='gap-2 px-1 text-[0.68rem]'>
            <span className='truncate'>{own ? 'You' : message.userName}</span>
            <time className='shrink-0 font-normal' dateTime={new Date(message.createdAt).toISOString()}>
              {formatChatTime(message.createdAt)}
            </time>
          </MessageHeader>
          <Bubble align={own ? 'end' : 'start'} className='w-[88%] max-w-[22rem]' variant={own ? 'default' : 'muted'}>
            <BubbleContent className={`w-full whitespace-pre-wrap ${own ? 'rounded-br-sm' : 'rounded-bl-sm'}`}>
              {message.content}
            </BubbleContent>
          </Bubble>
        </MessageContent>
      </Message>
    </MessageScrollerItem>
  );
}

function LoadingTranscript() {
  return (
    <MessageScrollerItem className='space-y-3 py-3' messageId='loading'>
      <div className='bg-muted h-16 w-3/4 animate-pulse rounded-2xl rounded-bl-md' />
      <div className='bg-primary/15 ml-auto h-12 w-2/3 animate-pulse rounded-2xl rounded-br-md' />
      <span className='sr-only' role='status'>
        Loading messages…
      </span>
    </MessageScrollerItem>
  );
}

function EmptyTranscript() {
  return (
    <MessageScrollerItem
      className='flex min-h-44 flex-col items-center justify-center px-5 text-center'
      messageId='empty'
    >
      <span className='bg-muted mb-3 flex size-10 items-center justify-center rounded-full'>
        <MessageCircle className='text-muted-foreground size-5' aria-hidden='true' />
      </span>
      <p className='font-medium'>Start the conversation</p>
      <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>No messages yet. Say hello to your team.</p>
    </MessageScrollerItem>
  );
}

function ReconnectStatus() {
  return (
    <p
      className='bg-muted text-muted-foreground flex items-center justify-center gap-2 border-t px-3 py-2 text-xs'
      role='status'
    >
      <WifiOff className='size-3.5' aria-hidden='true' />
      <span className='shimmer'>Connection lost. Trying again…</span>
    </p>
  );
}

function ChatComposer({
  connected,
  content,
  onChange,
  onSubmit,
}: {
  connected: boolean;
  content: string;
  onChange: (content: string) => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
}) {
  return (
    <form className='bg-card flex items-end gap-2 border-t p-3' onSubmit={onSubmit}>
      <label className='sr-only' htmlFor='session-chat-message'>
        Message
      </label>
      <textarea
        className='bg-background placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 field-sizing-content max-h-28 min-h-9 min-w-0 flex-1 resize-none rounded-lg border px-3 py-2 text-sm leading-5 transition-shadow outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50'
        disabled={!connected}
        id='session-chat-message'
        maxLength={800}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder='Say something…'
        rows={1}
        value={content}
      />
      <Button aria-label='Send message' disabled={!connected || !content.trim()} size='icon-lg' type='submit'>
        {connected ? <Send aria-hidden='true' /> : <LoaderCircle className='animate-spin' aria-hidden='true' />}
      </Button>
    </form>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');
}

function formatChatTime(createdAt: number) {
  return new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit' }).format(createdAt);
}

export { LiveChat };
