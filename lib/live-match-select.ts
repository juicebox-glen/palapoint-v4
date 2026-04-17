/**
 * Reusable select field lists for `live_matches` queries.
 * Keeps spectator / control / court displays aligned.
 *
 * Lives at `lib/live-match-select.ts` (not under `lib/supabase/`) because `lib/supabase.ts`
 * is a file — `@/lib/supabase/selects` cannot resolve to a sibling folder on all bundlers.
 */

/** Full row — matches `MatchState` + fields used by SpectatorDisplay. */
export const LIVE_MATCH_FULL_SELECT = [
  'id',
  'court_id',
  'version',
  'game_mode',
  'sets_to_win',
  'tiebreak_at',
  'status',
  'current_set',
  'is_tiebreak',
  'team_a_points',
  'team_b_points',
  'team_a_games',
  'team_b_games',
  'set_scores',
  'tiebreak_scores',
  'tiebreak_starting_server',
  'deuce_count',
  'serving_team',
  'team_a_player_1',
  'team_a_player_2',
  'team_b_player_1',
  'team_b_player_2',
  'team_a_player_1_photo',
  'team_a_player_2_photo',
  'team_b_player_1_photo',
  'team_b_player_2_photo',
  'winner',
  'started_at',
  'completed_at',
  'side_swap_enabled',
  'session_id',
  'created_at',
].join(',')

/** Minimal row for idle / list UIs. */
export const LIVE_MATCH_MINIMAL_SELECT = [
  'id',
  'court_id',
  'status',
  'team_a_player_1',
  'team_a_player_2',
  'team_b_player_1',
  'team_b_player_2',
  'winner',
  'created_at',
].join(',')

/** Score-focused subset for live scoring surfaces. */
export const LIVE_MATCH_SCORE_SELECT = [
  'id',
  'court_id',
  'status',
  'game_mode',
  'sets_to_win',
  'team_a_points',
  'team_b_points',
  'team_a_games',
  'team_b_games',
  'serving_team',
  'is_tiebreak',
  'tiebreak_scores',
  'tiebreak_starting_server',
  'deuce_count',
  'set_scores',
  'winner',
  'current_set',
].join(',')
