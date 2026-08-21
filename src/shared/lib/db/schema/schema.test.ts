import { getTableConfig } from 'drizzle-orm/sqlite-core';
import { describe, expect, test } from 'vite-plus/test';

import { user } from './auth';
import {
  bingoCard,
  bingoCardCell,
  bingoTerm,
  gameSession,
  gameSessionResult,
  team,
  teamBingoRulesPreset,
  teamMember,
} from './veo';

describe('database schema', () => {
  test('keeps user emails unique for Better Auth', () => {
    const config = getTableConfig(user);

    expect(config.indexes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          config: expect.objectContaining({ name: 'user_email_unique', unique: true }),
        }),
      ]),
    );
  });

  test('allows a user to join a team only once', () => {
    const config = getTableConfig(teamMember);

    expect(config.primaryKeys[0]?.columns.map((column) => column.name)).toEqual(['team_id', 'user_id']);
  });

  test('keeps normalized bingo terms unique within a team', () => {
    const config = getTableConfig(bingoTerm);
    const uniqueIndex = config.indexes.find(
      (candidate) => candidate.config.name === 'bingo_term_team_normalized_label_unique',
    );

    expect(uniqueIndex?.config.unique).toBe(true);
    expect(
      uniqueIndex?.config.columns.map((column) =>
        typeof column === 'object' && 'name' in column ? column.name : undefined,
      ),
    ).toEqual(['team_id', 'normalized_label']);
  });

  test('stores stable labels at one position per card', () => {
    const config = getTableConfig(bingoCardCell);

    expect(config.primaryKeys[0]?.columns.map((column) => column.name)).toEqual(['card_id', 'position']);
    expect(bingoCardCell.labelSnapshot.notNull).toBe(true);
    expect(config.checks.map((constraint) => constraint.name)).toContain('bingo_card_cell_position_check');
  });

  test('persists a rules snapshot on cards and configurable defaults on teams', () => {
    expect(team.bingoBoardSize.default).toBe(5);
    expect(team.bingoWinHorizontal.default).toBe(true);
    expect(bingoCard.boardSize.default).toBe(5);
    expect(bingoCard.winDiagonal.default).toBe(true);
    expect(team.defaultBingoRulesPresetId.notNull).toBe(false);
  });

  test('keeps reusable rule template names unique within a team', () => {
    const config = getTableConfig(teamBingoRulesPreset);
    const uniqueIndex = config.indexes.find(
      (candidate) => candidate.config.name === 'team_bingo_rules_preset_team_name_unique',
    );

    expect(uniqueIndex?.config.unique).toBe(true);
  });

  test('models game-session lifecycle and keeps join tokens unique', () => {
    const config = getTableConfig(gameSession);
    const uniqueIndex = config.indexes.find(
      (candidate) => candidate.config.name === 'game_session_invite_token_hash_unique',
    );

    expect(gameSession.status.notNull).toBe(true);
    expect(config.checks.map((constraint) => constraint.name)).toContain('game_session_status_check');
    expect(uniqueIndex?.config.unique).toBe(true);
    expect(getTableConfig(gameSessionResult).primaryKeys[0]?.columns.map((column) => column.name)).toEqual([
      'session_id',
      'user_id',
    ]);
  });
});
