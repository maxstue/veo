import { DurableObject } from 'cloudflare:workers';

import { Metrics } from '#/shared/lib/observability/metrics';

import { getLongestMarkedLineLength, hasBingo, type BingoRules } from '../bingo/bingo-game';
import type {
  GameSessionCard,
  GameSessionCardSeed,
  GameSessionChatMessage,
  GameSessionLiveEvent,
  GameSessionParticipant,
  GameSessionResult,
  GameSessionScore,
} from './types';

type Connection = GameSessionParticipant;

type ChatMessageRow = {
  content: string;
  createdAt: number;
  id: number;
  userId: string;
  userName: string;
};

type CardRow = {
  boardSize: number;
  completedAt: number | null;
  createdAt: number;
  userId: string;
  userName: string;
  winDiagonal: number;
  winHorizontal: number;
  winVertical: number;
};

type CellRow = {
  labelSnapshot: string;
  marked: number;
  position: number;
  userId: string;
};

type CleanupRow = {
  expiresAt: number;
  sessionId: string;
  status: 'active' | 'created';
  teamId: string;
};

/** Coordinates the live state of one team bingo session. */
export class GameSession extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    migrateStorage(ctx);
  }

  async fetch(request: Request) {
    if (request.headers.get('Upgrade')?.toLowerCase() !== 'websocket') {
      return new Response('WebSocket upgrade required', { status: 426 });
    }

    const connection = readConnection(request.headers);
    if (!connection) {
      return new Response('Authenticated connection required', { status: 401 });
    }

    const [client, server] = Object.values(new WebSocketPair()) as [WebSocket, WebSocket];
    this.ctx.acceptWebSocket(server, [`user:${connection.userId}`]);
    server.serializeAttachment(connection);
    server.send(
      stringify({
        type: 'snapshot',
        card: this.getCard(connection.userId),
        messages: this.getMessages(),
        participants: this.getParticipants(),
        scores: this.getScores(),
      }),
    );
    this.broadcast({ type: 'presence', participants: this.getParticipants() });

    return new Response(null, { status: 101, webSocket: client });
  }

  async createCard(seed: GameSessionCardSeed) {
    this.assertOpen();
    const existing = this.getCard(seed.userId);
    if (existing) {
      return { card: existing, status: 'exists' as const };
    }

    validateCardSeed(seed);
    this.ctx.storage.sql.exec(
      `INSERT INTO session_card (
         user_id, user_name, board_size, win_horizontal, win_vertical, win_diagonal, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      seed.userId,
      seed.userName,
      seed.rules.boardSize,
      Number(seed.rules.horizontal),
      Number(seed.rules.vertical),
      Number(seed.rules.diagonal),
      seed.createdAt,
    );
    for (const cell of seed.cells) {
      this.ctx.storage.sql.exec(
        `INSERT INTO session_card_cell (user_id, position, label_snapshot, marked)
         VALUES (?, ?, ?, 0)`,
        seed.userId,
        cell.position,
        cell.label,
      );
    }

    const card = this.getRequiredCard(seed.userId);
    this.publishCard(card, this.getRequiredScore(seed.userId));
    return { card, status: 'created' as const };
  }

  async readCard(userId: string) {
    return this.getCard(userId);
  }

  async readScores() {
    return this.getScores();
  }

  async toggleCell(userId: string, position: number) {
    this.assertOpen();
    const currentCard = this.getCard(userId);
    if (!currentCard) {
      return null;
    }
    if (currentCard.completedAt !== null || currentCard.bingo) {
      throw new Error('Bingo card is already complete');
    }
    const updated = this.ctx.storage.sql
      .exec<{ marked: number }>(
        `UPDATE session_card_cell
         SET marked = CASE marked WHEN 1 THEN 0 ELSE 1 END
         WHERE user_id = ? AND position = ?
         RETURNING marked`,
        userId,
        position,
      )
      .toArray()[0];
    if (!updated) {
      return null;
    }

    let card = this.getRequiredCard(userId);
    const completedNow = card.bingo && card.completedAt === null;
    if (completedNow) {
      const completedAt = Date.now();
      this.ctx.storage.sql.exec(
        'UPDATE session_card SET completed_at = ? WHERE user_id = ? AND completed_at IS NULL',
        completedAt,
        userId,
      );
      card = this.getRequiredCard(userId);
    }

    const score = this.getRequiredScore(userId);
    this.publishCard(card, score);
    return { card, completedNow, marked: Boolean(updated.marked), score };
  }

  async resetCard(userId: string) {
    this.assertOpen();
    const currentCard = this.getCard(userId);
    if (currentCard?.completedAt != null || currentCard?.bingo) {
      throw new Error('Bingo card is already complete');
    }
    const exists = this.ctx.storage.sql
      .exec<{ found: number }>('SELECT 1 as found FROM session_card WHERE user_id = ? LIMIT 1', userId)
      .toArray()[0];
    if (!exists) {
      return null;
    }
    this.ctx.storage.sql.exec('UPDATE session_card_cell SET marked = 0 WHERE user_id = ?', userId);
    const card = this.getRequiredCard(userId);
    const score = this.getRequiredScore(userId);
    this.publishCard(card, score);
    return { card, score };
  }

  /** Registers the D1 identity and absolute lifetime without extending an existing session. */
  async initialize(sessionId: string, teamId: string, expiresAt: number, status: 'active' | 'created') {
    validateCleanup(sessionId, teamId, expiresAt);
    this.ctx.storage.sql.exec(
      `INSERT OR IGNORE INTO session_cleanup (singleton, session_id, team_id, expires_at, status)
       VALUES (1, ?, ?, ?, ?)`,
      sessionId,
      teamId,
      expiresAt,
      status,
    );
    const cleanup = this.getCleanup();
    if (cleanup?.sessionId !== sessionId || cleanup?.teamId !== teamId) {
      throw new Error('Durable Object is already assigned to another session');
    }
    await this.ctx.storage.setAlarm(cleanup.expiresAt);
  }

  /** Moves connected waiting-room participants into the live game and starts its maximum lifetime. */
  async start(expiresAt: number) {
    if (!Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
      throw new TypeError('Invalid session expiration');
    }
    const cleanup = this.getCleanup();
    if (!cleanup) {
      throw new Error('Session cleanup was not initialized');
    }
    if (cleanup.status === 'created') {
      this.ctx.storage.sql.exec(
        "UPDATE session_cleanup SET expires_at = ?, status = 'active' WHERE singleton = 1",
        expiresAt,
      );
      await this.ctx.storage.setAlarm(expiresAt);
      this.broadcast({ type: 'session-started' });
    } else {
      await this.ctx.storage.setAlarm(cleanup.expiresAt);
    }
  }

  /** Deletes an abandoned session when its absolute lifetime has elapsed. */
  async alarm() {
    const cleanup = this.getCleanup();
    if (!cleanup) {
      return;
    }
    if (cleanup.expiresAt > Date.now()) {
      await this.ctx.storage.setAlarm(cleanup.expiresAt);
      return;
    }

    const deleted = await this.env.DB.prepare(
      `DELETE FROM game_session
       WHERE id = ? AND team_id = ? AND status IN ('created', 'active')`,
    )
      .bind(cleanup.sessionId, cleanup.teamId)
      .run();
    if (deleted.meta.changes) {
      Metrics.recordGameSessionExpired();
    }
    await this.remove();
  }

  async finalize(): Promise<GameSessionResult[]> {
    this.ctx.storage.sql.exec("UPDATE session_state SET status = 'sealed' WHERE singleton = 1");
    return this.ctx.storage.sql
      .exec<GameSessionResult>(
        'SELECT user_id as userId, completed_at as completedAt FROM session_card ORDER BY user_id',
      )
      .toArray();
  }

  /** Closes connected participants after the final results have been persisted in D1. */
  async completeEnd(endedBy: string) {
    this.broadcast({ type: 'session-ended', endedBy });
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(1000, 'Session ended');
    }
    await this.clearStorage();
  }

  /** Removes transient session state after its D1 row has been manually deleted. */
  async remove() {
    this.broadcast({ type: 'session-deleted' });
    for (const socket of this.ctx.getWebSockets()) {
      socket.close(1000, 'Session deleted');
    }
    await this.clearStorage();
  }

  /** Manually deletes the session only while no participant other than the requester is connected. */
  async removeIfUnoccupied(requesterUserId: string) {
    if (!requesterUserId) {
      throw new TypeError('Invalid requester');
    }
    if (!(await this.canRemove(requesterUserId))) {
      return { status: 'occupied' as const };
    }

    const cleanup = this.getCleanup();
    if (!cleanup) {
      throw new Error('Session cleanup was not initialized');
    }
    const deleted = await this.env.DB.prepare(
      `DELETE FROM game_session
       WHERE id = ? AND team_id = ? AND status IN ('created', 'active')`,
    )
      .bind(cleanup.sessionId, cleanup.teamId)
      .run();
    if (!deleted.meta.changes) {
      return { status: 'unavailable' as const };
    }

    await this.remove();
    return { status: 'deleted' as const };
  }

  async canRemove(requesterUserId: string) {
    if (!requesterUserId) {
      return false;
    }
    return this.getParticipants().every((participant) => participant.userId === requesterUserId);
  }

  async webSocketMessage(socket: WebSocket, message: ArrayBuffer | string) {
    if (typeof message !== 'string' || message.length > 4_096) {
      return;
    }

    const connection = readAttachment(socket);
    const content = readChatContent(message);
    if (!connection || !content || !this.isOpen()) {
      return;
    }

    const createdAt = Date.now();
    const result = this.ctx.storage.sql.exec<{ id: number }>(
      `INSERT INTO chat_message (user_id, user_name, content, created_at)
       VALUES (?, ?, ?, ?)
       RETURNING id`,
      connection.userId,
      connection.userName,
      content,
      createdAt,
    );
    const id = result.one().id;
    this.broadcast({
      type: 'chat-message',
      message: { ...connection, content, createdAt, id },
    });
  }

  async webSocketClose(socket: WebSocket) {
    socket.close();
    this.broadcast({ type: 'presence', participants: this.getParticipants() });
  }

  private broadcast(event: GameSessionLiveEvent) {
    const message = stringify(event);
    for (const socket of this.ctx.getWebSockets()) {
      try {
        socket.send(message);
      } catch {
        // A closing socket is removed by the runtime shortly afterwards.
      }
    }
  }

  private getMessages(): GameSessionChatMessage[] {
    return this.ctx.storage.sql
      .exec<ChatMessageRow>(
        'SELECT id, user_id as userId, user_name as userName, content, created_at as createdAt FROM chat_message ORDER BY id DESC LIMIT 100',
      )
      .toArray()
      .reverse();
  }

  private getCard(userId: string): GameSessionCard | null {
    const card = this.ctx.storage.sql
      .exec<CardRow>(
        `SELECT user_id as userId, user_name as userName, board_size as boardSize,
                win_horizontal as winHorizontal, win_vertical as winVertical,
                win_diagonal as winDiagonal, created_at as createdAt, completed_at as completedAt
         FROM session_card WHERE user_id = ? LIMIT 1`,
        userId,
      )
      .toArray()[0];
    if (!card) {
      return null;
    }
    const cells = this.ctx.storage.sql
      .exec<CellRow>(
        `SELECT user_id as userId, position, label_snapshot as labelSnapshot, marked
         FROM session_card_cell WHERE user_id = ? ORDER BY position`,
        userId,
      )
      .toArray();
    const rules = readRules(card);
    const markedPositions = cells.filter((cell) => cell.marked).map((cell) => cell.position);
    return {
      id: userId,
      bingo: hasBingo(markedPositions, rules),
      cells: cells.map((cell) => ({
        labelSnapshot: cell.labelSnapshot,
        marked: Boolean(cell.marked),
        position: cell.position,
      })),
      completedAt: card.completedAt,
      createdAt: card.createdAt,
      rules,
    };
  }

  private getRequiredCard(userId: string) {
    const card = this.getCard(userId);
    if (!card) {
      throw new Error('Session card disappeared after a successful mutation');
    }
    return card;
  }

  private getScores(): GameSessionScore[] {
    const cards = this.ctx.storage.sql
      .exec<CardRow>(
        `SELECT user_id as userId, user_name as userName, board_size as boardSize,
                win_horizontal as winHorizontal, win_vertical as winVertical,
                win_diagonal as winDiagonal, created_at as createdAt, completed_at as completedAt
         FROM session_card ORDER BY user_name, user_id`,
      )
      .toArray();
    const markedByUser = new Map<string, number[]>();
    for (const cell of this.ctx.storage.sql
      .exec<CellRow>(
        `SELECT user_id as userId, position, label_snapshot as labelSnapshot, marked
         FROM session_card_cell WHERE marked = 1 ORDER BY user_id, position`,
      )
      .toArray()) {
      markedByUser.set(cell.userId, [...(markedByUser.get(cell.userId) ?? []), cell.position]);
    }
    return cards.map((card) => {
      const positions = markedByUser.get(card.userId) ?? [];
      const rules = readRules(card);
      return {
        bingo: hasBingo(positions, rules),
        boardSize: card.boardSize as BingoRules['boardSize'],
        completedAt: card.completedAt,
        longestLine: getLongestMarkedLineLength(positions, rules),
        userId: card.userId,
        userName: card.userName,
      };
    });
  }

  private getRequiredScore(userId: string) {
    const score = this.getScores().find((candidate) => candidate.userId === userId);
    if (!score) {
      throw new Error('Session score disappeared after a successful mutation');
    }
    return score;
  }

  private publishCard(card: GameSessionCard, score: GameSessionScore) {
    this.sendToUser(score.userId, { type: 'card-updated', card });
    this.broadcast({ type: 'score-updated', score });
  }

  private sendToUser(userId: string, event: GameSessionLiveEvent) {
    const message = stringify(event);
    for (const socket of this.ctx.getWebSockets(`user:${userId}`)) {
      try {
        socket.send(message);
      } catch {
        // A closing socket is removed by the runtime shortly afterwards.
      }
    }
  }

  private assertOpen() {
    if (!this.isOpen()) {
      throw new Error('Game session is sealed');
    }
  }

  private isOpen() {
    const state = this.ctx.storage.sql
      .exec<{ status: string }>('SELECT status FROM session_state WHERE singleton = 1')
      .one();
    return state.status === 'open';
  }

  private getParticipants() {
    const participants = new Map<string, GameSessionParticipant>();
    for (const socket of this.ctx.getWebSockets()) {
      const connection = readAttachment(socket);
      if (connection) {
        participants.set(connection.userId, connection);
      }
    }
    return [...participants.values()].sort((left, right) => left.userName.localeCompare(right.userName));
  }

  private getCleanup() {
    return this.ctx.storage.sql
      .exec<CleanupRow>(
        `SELECT session_id as sessionId, team_id as teamId, expires_at as expiresAt, status
         FROM session_cleanup WHERE singleton = 1`,
      )
      .toArray()[0];
  }

  private async clearStorage() {
    await this.ctx.storage.deleteAlarm();
    await this.ctx.storage.deleteAll();
  }
}

function migrateStorage(ctx: DurableObjectState) {
  ctx.storage.sql.exec(`
      CREATE TABLE IF NOT EXISTS _sql_schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS session_state (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        status TEXT NOT NULL CHECK (status IN ('open', 'sealed'))
      );
      INSERT OR IGNORE INTO session_state (singleton, status) VALUES (1, 'open');
      CREATE TABLE IF NOT EXISTS session_cleanup (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        session_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        expires_at INTEGER NOT NULL,
        status TEXT NOT NULL CHECK (status IN ('created', 'active'))
      );
      CREATE TABLE IF NOT EXISTS session_card (
        user_id TEXT PRIMARY KEY,
        user_name TEXT NOT NULL,
        board_size INTEGER NOT NULL CHECK (board_size BETWEEN 1 AND 8),
        win_horizontal INTEGER NOT NULL CHECK (win_horizontal IN (0, 1)),
        win_vertical INTEGER NOT NULL CHECK (win_vertical IN (0, 1)),
        win_diagonal INTEGER NOT NULL CHECK (win_diagonal IN (0, 1)),
        created_at INTEGER NOT NULL,
        completed_at INTEGER
      );
      CREATE TABLE IF NOT EXISTS session_card_cell (
        user_id TEXT NOT NULL,
        position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 63),
        label_snapshot TEXT NOT NULL,
        marked INTEGER NOT NULL DEFAULT 0 CHECK (marked IN (0, 1)),
        PRIMARY KEY (user_id, position),
        FOREIGN KEY (user_id) REFERENCES session_card(user_id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS chat_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS chat_message_created_at_idx ON chat_message (created_at);
      INSERT OR IGNORE INTO _sql_schema_migrations (version, applied_at) VALUES (1, unixepoch() * 1000);
  `);
}

function readRules(card: CardRow): BingoRules {
  return {
    boardSize: card.boardSize as BingoRules['boardSize'],
    diagonal: Boolean(card.winDiagonal),
    horizontal: Boolean(card.winHorizontal),
    vertical: Boolean(card.winVertical),
  };
}

function validateCardSeed(seed: GameSessionCardSeed) {
  const expectedCells = seed.rules.boardSize ** 2;
  if (
    !seed.userId ||
    !seed.userName ||
    !Number.isInteger(seed.createdAt) ||
    seed.cells.length !== expectedCells ||
    new Set(seed.cells.map((cell) => cell.position)).size !== expectedCells ||
    seed.cells.some(
      (cell) =>
        !Number.isInteger(cell.position) ||
        cell.position < 0 ||
        cell.position >= expectedCells ||
        !cell.label ||
        cell.label.length > 500,
    )
  ) {
    throw new TypeError('Invalid session card');
  }
}

function validateCleanup(sessionId: string, teamId: string, expiresAt: number) {
  if (!sessionId || !teamId || !Number.isSafeInteger(expiresAt) || expiresAt <= Date.now()) {
    throw new TypeError('Invalid session cleanup');
  }
}

function readAttachment(socket: WebSocket) {
  const attachment = socket.deserializeAttachment();
  return isConnection(attachment) ? attachment : null;
}

function readChatContent(message: string) {
  try {
    const parsed: unknown = JSON.parse(message);
    if (!parsed || typeof parsed !== 'object' || (parsed as Record<string, unknown>).type !== 'chat') {
      return null;
    }
    const content = (parsed as Record<string, unknown>).content;
    if (typeof content !== 'string') {
      return null;
    }
    const normalized = content.trim().replace(/\s+/g, ' ');
    return normalized && normalized.length <= 800 ? normalized : null;
  } catch {
    return null;
  }
}

function readConnection(headers: Headers) {
  const userId = headers.get('X-Veo-User-Id');
  const encodedName = headers.get('X-Veo-User-Name');
  if (!userId || !encodedName) {
    return null;
  }

  try {
    const userName = decodeURIComponent(encodedName);
    return isConnection({ userId, userName }) ? { userId, userName } : null;
  } catch {
    return null;
  }
}

function isConnection(value: unknown): value is Connection {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const { userId, userName } = value as Record<string, unknown>;
  return typeof userId === 'string' && userId.length > 0 && typeof userName === 'string' && userName.length > 0;
}

function stringify(event: GameSessionLiveEvent) {
  return JSON.stringify(event);
}
