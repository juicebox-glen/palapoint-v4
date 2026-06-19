import type { SessionReviewGame, SessionReviewSession } from '@/components/displays/SessionReviewDisplay'

export const PREVIEW_SESSION: SessionReviewSession = {
  id: 'preview-session-review',
  court_id: 'preview-court',
  started_at: '2026-04-15T10:00:00.000Z',
  ended_at: '2026-04-15T11:55:00.000Z',
}

export const PREVIEW_GAMES: SessionReviewGame[] = [
  {
    id: 'preview-game-1',
    team_a_player_1: 'Glen Noble',
    team_a_player_2: 'Rob Anderson',
    team_b_player_1: 'Julian Waters',
    team_b_player_2: 'Carl Pettit',
    winner: 'a',
    set_scores: [{ team_a_games: 6, team_b_games: 4 }],
    team_a_games: 6,
    team_b_games: 4,
    created_at: '2026-04-15T10:05:00.000Z',
    completed_at: '2026-04-15T10:42:00.000Z',
  },
  {
    id: 'preview-game-2',
    team_a_player_1: 'Julian Waters',
    team_a_player_2: 'Glen Noble',
    team_b_player_1: 'Carl Pettit',
    team_b_player_2: 'Rob Anderson',
    winner: 'b',
    set_scores: [{ team_a_games: 4, team_b_games: 6 }],
    team_a_games: 4,
    team_b_games: 6,
    created_at: '2026-04-15T10:50:00.000Z',
    completed_at: '2026-04-15T11:20:00.000Z',
  },
  {
    id: 'preview-game-3',
    team_a_player_1: 'Rob Anderson',
    team_a_player_2: 'Carl Pettit',
    team_b_player_1: 'Glen Noble',
    team_b_player_2: 'Julian Waters',
    winner: 'a',
    set_scores: [
      { team_a: 6, team_b: 2 },
      { team_a: 4, team_b: 6 },
      { team_a: 6, team_b: 3 },
    ],
    team_a_games: 2,
    team_b_games: 1,
    created_at: '2026-04-15T11:22:00.000Z',
    completed_at: '2026-04-15T11:52:00.000Z',
  },
]
