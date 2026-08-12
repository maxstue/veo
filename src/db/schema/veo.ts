import { relations, sql } from 'drizzle-orm';
import { check, index, integer, primaryKey, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

import { user } from './auth';

export type GameSessionStatus = 'created' | 'active' | 'ended';

const timestamp = (name: string) => integer(name, { mode: 'timestamp_ms' });
const createdAt = () =>
  timestamp('created_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`);
const updatedAt = () =>
  timestamp('updated_at')
    .notNull()
    .default(sql`(unixepoch() * 1000)`)
    .$onUpdate(() => new Date());

export const team = sqliteTable(
  'team',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    bingoBoardSize: integer('bingo_board_size').notNull().default(5),
    bingoWinHorizontal: integer('bingo_win_horizontal', { mode: 'boolean' }).notNull().default(true),
    bingoWinVertical: integer('bingo_win_vertical', { mode: 'boolean' }).notNull().default(true),
    bingoWinDiagonal: integer('bingo_win_diagonal', { mode: 'boolean' }).notNull().default(true),
    defaultBingoRulesPresetId: text('default_bingo_rules_preset_id'),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [index('team_created_by_user_id_idx').on(table.createdByUserId)],
);

export const teamMember = sqliteTable(
  'team_member',
  {
    teamId: text('team_id')
      .notNull()
      .references(() => team.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    joinedAt: timestamp('joined_at')
      .notNull()
      .default(sql`(unixepoch() * 1000)`),
  },
  (table) => [primaryKey({ columns: [table.teamId, table.userId] }), index('team_member_user_id_idx').on(table.userId)],
);

export const teamInvitation = sqliteTable(
  'team_invitation',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => team.id, { onDelete: 'cascade' }),
    tokenHash: text('token_hash').notNull(),
    invitedByUserId: text('invited_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    expiresAt: timestamp('expires_at').notNull(),
    redeemedAt: timestamp('redeemed_at'),
    redeemedByUserId: text('redeemed_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    revokedAt: timestamp('revoked_at'),
    createdAt: createdAt(),
  },
  (table) => [
    uniqueIndex('team_invitation_token_hash_unique').on(table.tokenHash),
    index('team_invitation_team_id_idx').on(table.teamId),
    index('team_invitation_expires_at_idx').on(table.expiresAt),
  ],
);

export const teamBingoRulesPreset = sqliteTable(
  'team_bingo_rules_preset',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => team.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    boardSize: integer('board_size').notNull(),
    winHorizontal: integer('win_horizontal', { mode: 'boolean' }).notNull(),
    winVertical: integer('win_vertical', { mode: 'boolean' }).notNull(),
    winDiagonal: integer('win_diagonal', { mode: 'boolean' }).notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('team_bingo_rules_preset_team_name_unique').on(table.teamId, table.name),
    index('team_bingo_rules_preset_team_id_idx').on(table.teamId),
  ],
);

export const bingoTerm = sqliteTable(
  'bingo_term',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => team.id, { onDelete: 'cascade' }),
    label: text('label').notNull(),
    normalizedLabel: text('normalized_label').notNull(),
    createdByUserId: text('created_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    updatedByUserId: text('updated_by_user_id').references(() => user.id, {
      onDelete: 'set null',
    }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (table) => [
    uniqueIndex('bingo_term_team_normalized_label_unique').on(table.teamId, table.normalizedLabel),
    index('bingo_term_team_id_idx').on(table.teamId),
  ],
);

export const gameSession = sqliteTable(
  'game_session',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => team.id, { onDelete: 'cascade' }),
    createdByUserId: text('created_by_user_id').references(() => user.id, { onDelete: 'set null' }),
    inviteTokenHash: text('invite_token_hash').notNull(),
    status: text('status').$type<GameSessionStatus>().notNull(),
    createdAt: createdAt(),
    startedAt: timestamp('started_at'),
    endedAt: timestamp('ended_at'),
  },
  (table) => [
    uniqueIndex('game_session_invite_token_hash_unique').on(table.inviteTokenHash),
    index('game_session_team_status_idx').on(table.teamId, table.status),
    index('game_session_created_by_user_id_idx').on(table.createdByUserId),
    check('game_session_status_check', sql`${table.status} in ('created', 'active', 'ended')`),
  ],
);

export const gameSessionResult = sqliteTable(
  'game_session_result',
  {
    sessionId: text('session_id')
      .notNull()
      .references(() => gameSession.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    primaryKey({ columns: [table.sessionId, table.userId] }),
    index('game_session_result_user_id_idx').on(table.userId),
  ],
);

export const bingoCard = sqliteTable(
  'bingo_card',
  {
    id: text('id').primaryKey(),
    teamId: text('team_id')
      .notNull()
      .references(() => team.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    boardSize: integer('board_size').notNull().default(5),
    winHorizontal: integer('win_horizontal', { mode: 'boolean' }).notNull().default(true),
    winVertical: integer('win_vertical', { mode: 'boolean' }).notNull().default(true),
    winDiagonal: integer('win_diagonal', { mode: 'boolean' }).notNull().default(true),
    createdAt: createdAt(),
    completedAt: timestamp('completed_at'),
  },
  (table) => [
    index('bingo_card_team_user_idx').on(table.teamId, table.userId),
    index('bingo_card_created_at_idx').on(table.createdAt),
  ],
);

export const bingoCardCell = sqliteTable(
  'bingo_card_cell',
  {
    cardId: text('card_id')
      .notNull()
      .references(() => bingoCard.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    sourceTermId: text('source_term_id').references(() => bingoTerm.id, {
      onDelete: 'set null',
    }),
    labelSnapshot: text('label_snapshot').notNull(),
    markedAt: timestamp('marked_at'),
  },
  (table) => [
    primaryKey({ columns: [table.cardId, table.position] }),
    uniqueIndex('bingo_card_cell_source_term_unique').on(table.cardId, table.sourceTermId),
    check('bingo_card_cell_position_check', sql`${table.position} >= 0 AND ${table.position} < 64`),
  ],
);

export const teamRelations = relations(team, ({ one, many }) => ({
  createdBy: one(user, { fields: [team.createdByUserId], references: [user.id] }),
  members: many(teamMember),
  invitations: many(teamInvitation),
  bingoRulesPresets: many(teamBingoRulesPreset),
  terms: many(bingoTerm),
  gameSessions: many(gameSession),
  cards: many(bingoCard),
}));

export const teamBingoRulesPresetRelations = relations(teamBingoRulesPreset, ({ one }) => ({
  team: one(team, { fields: [teamBingoRulesPreset.teamId], references: [team.id] }),
}));

export const teamMemberRelations = relations(teamMember, ({ one }) => ({
  team: one(team, { fields: [teamMember.teamId], references: [team.id] }),
  user: one(user, { fields: [teamMember.userId], references: [user.id] }),
}));

export const bingoCardRelations = relations(bingoCard, ({ one, many }) => ({
  team: one(team, { fields: [bingoCard.teamId], references: [team.id] }),
  user: one(user, { fields: [bingoCard.userId], references: [user.id] }),
  cells: many(bingoCardCell),
}));

export const gameSessionRelations = relations(gameSession, ({ many, one }) => ({
  team: one(team, { fields: [gameSession.teamId], references: [team.id] }),
  createdBy: one(user, { fields: [gameSession.createdByUserId], references: [user.id] }),
  results: many(gameSessionResult),
}));

export const gameSessionResultRelations = relations(gameSessionResult, ({ one }) => ({
  session: one(gameSession, { fields: [gameSessionResult.sessionId], references: [gameSession.id] }),
  user: one(user, { fields: [gameSessionResult.userId], references: [user.id] }),
}));

export const bingoCardCellRelations = relations(bingoCardCell, ({ one }) => ({
  card: one(bingoCard, { fields: [bingoCardCell.cardId], references: [bingoCard.id] }),
  sourceTerm: one(bingoTerm, {
    fields: [bingoCardCell.sourceTermId],
    references: [bingoTerm.id],
  }),
}));
