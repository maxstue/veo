import { type Dispatch, type SetStateAction, useCallback, useEffect, useRef, useState } from 'react';

import type {
  GameSessionCard,
  GameSessionChatMessage,
  GameSessionLiveEvent,
  GameSessionParticipant,
  GameSessionScore,
} from './types';

type GameSessionSocketHandlers = {
  onCardUpdate: (card: GameSessionCard) => void;
  onMessages: Dispatch<SetStateAction<GameSessionChatMessage[]>>;
  onParticipants: (participants: GameSessionParticipant[]) => void;
  onScoreUpdate: (score: GameSessionScore) => void;
  onScores: (scores: GameSessionScore[]) => void;
  onSessionStarted: () => void;
  onSessionEnded: (endedBy: string) => void;
  onSessionDeleted: () => void;
};

export function useGameSessionSocket(sessionId: string | undefined, handlers: GameSessionSocketHandlers) {
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
        disposed = handleGameSessionSocketMessage(event.data, handlersRef.current) || disposed;
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

  const sendChat = useCallback((content: string) => {
    if (socket.current?.readyState !== WebSocket.OPEN || !content.trim()) {
      return false;
    }
    socket.current.send(JSON.stringify({ type: 'chat', content }));
    return true;
  }, []);

  return { connected, sendChat };
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

function handleGameSessionSocketMessage(value: unknown, handlers: GameSessionSocketHandlers) {
  const message = parseLiveEvent(value);
  if (!message) {
    return false;
  }
  if (message.type === 'snapshot') {
    if (message.card) {
      handlers.onCardUpdate(message.card);
    }
    handlers.onMessages(message.messages);
    handlers.onParticipants(message.participants);
    handlers.onScores(message.scores);
    return false;
  }
  if (message.type === 'presence') {
    handlers.onParticipants(message.participants);
    return false;
  }
  if (message.type === 'chat-message') {
    handlers.onMessages((current) => [...current, message.message].slice(-100));
    return false;
  }
  if (message.type === 'card-updated') {
    handlers.onCardUpdate(message.card);
    return false;
  }
  if (message.type === 'score-updated') {
    handlers.onScoreUpdate(message.score);
    return false;
  }
  if (message.type === 'session-started') {
    handlers.onSessionStarted();
    return false;
  }
  if (message.type === 'session-ended') {
    handlers.onSessionEnded(message.endedBy);
    return false;
  }
  handlers.onSessionDeleted();
  return true;
}
