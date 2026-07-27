import type { MatchState } from '@/lib/types/match'

export const MOCK_SHOWCASE_MATCH: MatchState = {
  id: 'mock-showcase-match',
  court_id: 'mock-court-id',
  version: 1,
  game_mode: 'golden_point',
  sets_to_win: 2,
  tiebreak_at: 6,
  status: 'in_progress',
  current_set: 2,
  is_tiebreak: false,
  team_a_points: 3,
  team_b_points: 2,
  team_a_games: 4,
  team_b_games: 3,
  set_scores: [{ team_a: 6, team_b: 4 }],
  deuce_count: 0,
  serving_team: 'a',
  team_a_player_1: 'Glen Noble',
  team_a_player_2: 'Robert Anderson',
  team_b_player_1: 'Carl Pettitt',
  team_b_player_2: 'Alex Read',
  team_a_player_1_photo: '/images/palalive/players/glen.jpg',
  team_a_player_2_photo: null,
  team_b_player_1_photo: '/images/palalive/players/carl.jpg',
  team_b_player_2_photo: null,
  winner: null,
  side_swap_enabled: true,
  session_id: null,
}

/** 'setup'-status match for DS Showcase · Pregame preview (build-up hold, before first point). */
export const MOCK_SHOWCASE_PREGAME: MatchState = {
  ...MOCK_SHOWCASE_MATCH,
  id: 'mock-showcase-pregame',
  status: 'setup',
  current_set: 1,
  team_a_points: 0,
  team_b_points: 0,
  team_a_games: 0,
  team_b_games: 0,
  set_scores: [],
  serving_team: null,
}

/** Completed match for DS Showcase · End preview (SpectatorEndgame hold). */
export const MOCK_SHOWCASE_ENDGAME: MatchState = {
  ...MOCK_SHOWCASE_MATCH,
  id: 'mock-showcase-endgame',
  status: 'completed',
  current_set: 3,
  team_a_points: 0,
  team_b_points: 0,
  team_a_games: 0,
  team_b_games: 0,
  set_scores: [
    { team_a: 6, team_b: 4 },
    { team_a: 3, team_b: 6 },
    { team_a: 7, team_b: 5 },
  ],
  serving_team: 'a',
  winner: 'a',
}

/**
 * Abandoned before any set was won (e.g. ended at 30-0 mid-game) for DS Showcase ·
 * End (No Winner) preview — no resolvable winner, falls back to "MATCH COMPLETE".
 */
export const MOCK_SHOWCASE_ENDGAME_NO_WINNER: MatchState = {
  ...MOCK_SHOWCASE_MATCH,
  id: 'mock-showcase-endgame-no-winner',
  status: 'abandoned',
  current_set: 1,
  team_a_points: 30,
  team_b_points: 0,
  team_a_games: 0,
  team_b_games: 0,
  set_scores: [],
  serving_team: 'a',
  winner: null,
}
