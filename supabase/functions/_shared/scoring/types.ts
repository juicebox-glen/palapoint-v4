// ============================================================
// PALAPOINT V4 - SCORING ENGINE TYPES
// ============================================================

// Team identifier (lowercase to match database)
export type Team = 'a' | 'b';

// Game modes
export type GameMode = 'traditional' | 'golden_point' | 'silver_point';

// Match status
export type MatchStatus = 'setup' | 'in_progress' | 'completed' | 'abandoned';

// ============================================================
// MATCH STATE (mirrors live_matches table)
// ============================================================

export interface MatchState {
  id: string;
  court_id: string;
  version: number;
  
  // Configuration
  game_mode: GameMode;
  sets_to_win: 1 | 2;  // 1 = single set, 2 = best of 3
  tiebreak_at: 6 | 7;
  
  // Status
  status: MatchStatus;
  current_set: number;
  is_tiebreak: boolean;
  
  // Current game points (0, 1, 2, 3 = 0, 15, 30, 40; 4+ for advantage)
  team_a_points: number;
  team_b_points: number;
  
  // Current set games
  team_a_games: number;
  team_b_games: number;
  
  // Completed sets
  set_scores: Array<{ team_a: number; team_b: number }>;
  
  // Tiebreak state (tracked within current set)
  tiebreak_scores?: { team_a: number; team_b: number };
  tiebreak_starting_server?: Team; // Team that served first point of tiebreak (for FIP rotation)
  
  // Deuce tracking (for silver point)
  deuce_count: number;
  
  // Serving
  serving_team: Team | null;
  
  // Player names (optional)
  team_a_player_1?: string | null;
  team_a_player_2?: string | null;
  team_b_player_1?: string | null;
  team_b_player_2?: string | null;
  
  // Result
  winner: Team | null;
  
  // Timestamps
  started_at?: string | null;
  completed_at?: string | null;
}

// ============================================================
// SCORING INPUT/OUTPUT
// ============================================================

export interface ScoreEvent {
  type: 'point';
  team: Team;
}

export type Effect = 
  | { type: 'point_scored'; team: Team }
  | { type: 'game_won'; team: Team }
  | { type: 'set_won'; team: Team }
  | { type: 'match_won'; team: Team }
  | { type: 'tiebreak_started' }
  | { type: 'deuce' }
  | { type: 'advantage'; team: Team }
  | { type: 'set_started'; set_number: number };

export interface ScoreResult {
  newState: MatchState;
  effects: Effect[];
}

// ============================================================
// DISPLAY MODEL (for UI rendering)
// ============================================================

export interface DisplayModel {
  // Formatted point display ("0", "15", "30", "40", "Ad", or tiebreak numbers)
  points: { a: string; b: string };
  
  // Current set games
  games: { a: number; b: number };
  
  // Sets won
  sets_won: { a: number; b: number };
  
  // Server
  serving_team: Team | null;
  
  // Flags
  is_tiebreak: boolean;
  is_deuce: boolean;
  advantage: Team | null;
  
  // Status
  status: MatchStatus;
  winner: Team | null;
  
  // Player names
  team_a_name: string;
  team_b_name: string;
  
  // Set history
  set_scores: Array<{ team_a: number; team_b: number }>;
}

// ============================================================
// HELPER TYPES
// ============================================================

export function otherTeam(team: Team): Team {
  return team === 'a' ? 'b' : 'a';
}

export function getTeamPoints(state: MatchState, team: Team): number {
  return team === 'a' ? state.team_a_points : state.team_b_points;
}

export function getTeamGames(state: MatchState, team: Team): number {
  return team === 'a' ? state.team_a_games : state.team_b_games;
}
