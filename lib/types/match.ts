// ============================================================
// PALAPOINT V4 - SHARED MATCH TYPES
// Shared types for match state across the application
// ============================================================

export type Team = 'a' | 'b'

export type GameMode = 'traditional' | 'golden_point' | 'silver_point'

export type MatchStatus = 'setup' | 'in_progress' | 'completed' | 'abandoned'

export interface MatchState {
  id: string
  court_id: string
  version: number
  game_mode: GameMode
  sets_to_win: number
  tiebreak_at: number
  status: MatchStatus
  current_set: number
  is_tiebreak: boolean
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{ team_a: number; team_b: number }>
  tiebreak_scores?: { team_a: number; team_b: number }
  tiebreak_starting_server?: Team
  deuce_count: number
  serving_team: Team | null
  team_a_player_1?: string | null
  team_a_player_2?: string | null
  team_b_player_1?: string | null
  team_b_player_2?: string | null
  winner: Team | null
  started_at?: string | null
  completed_at?: string | null
  side_swap_enabled?: boolean
}
