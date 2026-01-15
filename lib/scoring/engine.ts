// ============================================================
// PALAPOINT V4 - SCORING ENGINE
// Pure functions for padel scoring logic
// Ported from V3 engine, adapted for cloud-first architecture
// ============================================================

import {
  MatchState,
  ScoreEvent,
  ScoreResult,
  Effect,
  Team,
  GameMode,
  DisplayModel,
  otherTeam,
  getTeamPoints,
  getTeamGames,
} from './types';

// ============================================================
// MAIN SCORING FUNCTION
// ============================================================

/**
 * Apply a score event to the match state
 * Pure function: takes state + event, returns new state + effects
 */
export function applyScore(state: MatchState, event: ScoreEvent): ScoreResult {
  // Deep clone to ensure immutability
  const s: MatchState = JSON.parse(JSON.stringify(state));
  const effects: Effect[] = [];
  
  // Don't score if match is finished
  if (s.status === 'completed' || s.status === 'abandoned') {
    return { newState: s, effects: [] };
  }
  
  // Start match if in setup
  if (s.status === 'setup') {
    s.status = 'in_progress';
    s.started_at = new Date().toISOString();
  }
  
  const team = event.team;
  effects.push({ type: 'point_scored', team });
  
  // Route to appropriate scoring logic
  if (s.is_tiebreak) {
    return scoreTiebreakPoint(s, team, effects);
  } else {
    return scoreGamePoint(s, team, effects);
  }
}

// ============================================================
// GAME POINT SCORING (Regular games)
// ============================================================

function scoreGamePoint(s: MatchState, team: Team, effects: Effect[]): ScoreResult {
  // Get current points
  const teamPoints = team === 'a' ? s.team_a_points : s.team_b_points;
  const opponentPoints = team === 'a' ? s.team_b_points : s.team_a_points;
  
  // Check for deuce situation BEFORE incrementing
  const wasDeuce = teamPoints >= 3 && opponentPoints >= 3 && teamPoints === opponentPoints;
  const wasAdvantage = teamPoints >= 3 && opponentPoints >= 3 && teamPoints !== opponentPoints;
  
  // Increment point
  if (team === 'a') {
    s.team_a_points++;
  } else {
    s.team_b_points++;
  }
  
  // Check for game win
  const gameWinner = checkGameWinner(s, wasDeuce, wasAdvantage, team, effects);
  
  if (gameWinner) {
    return handleGameWon(s, gameWinner, effects);
  }
  
  // Check for new deuce
  if (s.team_a_points >= 3 && s.team_b_points >= 3 && s.team_a_points === s.team_b_points) {
    s.deuce_count++;
    effects.push({ type: 'deuce' });
  }
  
  // Check for advantage
  if (s.team_a_points >= 3 && s.team_b_points >= 3 && Math.abs(s.team_a_points - s.team_b_points) === 1) {
    const advTeam: Team = s.team_a_points > s.team_b_points ? 'a' : 'b';
    effects.push({ type: 'advantage', team: advTeam });
  }
  
  return { newState: s, effects };
}

/**
 * Check if the game has been won
 */
function checkGameWinner(
  s: MatchState, 
  wasDeuce: boolean, 
  wasAdvantage: boolean,
  scoringTeam: Team,
  effects: Effect[]
): Team | null {
  const pA = s.team_a_points;
  const pB = s.team_b_points;
  
  // Standard game win: first to 4, win by 2
  // Points: 0=0, 1=15, 2=30, 3=40, 4+=game or advantage
  
  // Golden Point: At deuce, next point wins
  if (wasDeuce && s.game_mode === 'golden_point') {
    return scoringTeam;
  }
  
  // Silver Point: After 2 deuces (deuce_count >= 2), next point wins
  if (wasDeuce && s.game_mode === 'silver_point' && s.deuce_count >= 2) {
    return scoringTeam;
  }
  
  // Standard win: 4+ points and ahead by 2
  if (pA >= 4 && pA - pB >= 2) return 'a';
  if (pB >= 4 && pB - pA >= 2) return 'b';
  
  return null;
}

// ============================================================
// TIEBREAK POINT SCORING
// ============================================================

function scoreTiebreakPoint(s: MatchState, team: Team, effects: Effect[]): ScoreResult {
  // Initialize tiebreak scores if needed
  if (!s.tiebreak_scores) {
    s.tiebreak_scores = { team_a: 0, team_b: 0 };
  }
  
  // Increment tiebreak point
  if (team === 'a') {
    s.tiebreak_scores.team_a++;
  } else {
    s.tiebreak_scores.team_b++;
  }
  
  const tbA = s.tiebreak_scores.team_a;
  const tbB = s.tiebreak_scores.team_b;
  
  // Check tiebreak win: first to 7, win by 2
  let tiebreakWinner: Team | null = null;
  if (tbA >= 7 && tbA - tbB >= 2) tiebreakWinner = 'a';
  if (tbB >= 7 && tbB - tbA >= 2) tiebreakWinner = 'b';
  
  if (tiebreakWinner) {
    // Tiebreak won - this wins the set
    // The team that wins the tiebreak gets the set at 7-6 (or 6-7)
    // Games are already at 6-6, so we increment the winner's games to 7
    if (tiebreakWinner === 'a') {
      s.team_a_games = 7;
    } else {
      s.team_b_games = 7;
    }
    
    // Exit tiebreak mode
    s.is_tiebreak = false;
    s.tiebreak_scores = undefined;
    s.tiebreak_starting_server = undefined;
    
    effects.push({ type: 'game_won', team: tiebreakWinner });
    return handleSetWon(s, tiebreakWinner, effects);
  }
  
  // Update server for tiebreak (FIP rules)
  // Pattern: first point by starting server, then alternating every 2 points
  updateTiebreakServer(s);
  
  return { newState: s, effects };
}

/**
 * Update server during tiebreak using FIP (Federación Internacional de Pádel) rules
 * Pattern: 1, 2, 2, 2, 2, ...
 * - Point 0: Starting server serves (1 point)
 * - Points 1-2: Opposite server serves (2 points)
 * - Points 3-4: Starting server serves (2 points)
 * - Points 5-6: Opposite server serves (2 points)
 * - And so on...
 */
function updateTiebreakServer(s: MatchState): void {
  if (!s.tiebreak_scores || !s.tiebreak_starting_server) return;
  
  const totalPoints = s.tiebreak_scores.team_a + s.tiebreak_scores.team_b;
  
  if (totalPoints === 0) {
    // Before first point: starting server serves
    s.serving_team = s.tiebreak_starting_server;
    return;
  }
  
  // After point 0, pattern is: 2, 2, 2, 2, ...
  // So we alternate every 2 points starting from point 1
  // Point 1-2: opposite server
  // Point 3-4: starting server
  // Point 5-6: opposite server
  // etc.
  
  // Calculate which "pair" we're in (0-indexed from first pair after point 0)
  // Pair 0 = points 1-2, Pair 1 = points 3-4, Pair 2 = points 5-6, etc.
  const pairNumber = Math.floor((totalPoints - 1) / 2);
  
  // Odd pairs (0, 2, 4...) = opposite server
  // Even pairs (1, 3, 5...) = starting server
  // But wait, we need to account for point 0 being starting server
  // So: point 0 = starting, points 1-2 = opposite, points 3-4 = starting, etc.
  
  if (totalPoints === 1) {
    // First point after tiebreak start: switch to opposite server
    s.serving_team = otherTeam(s.tiebreak_starting_server);
  } else {
    // For subsequent points, check if we're at the start of a new pair
    // Points 1, 3, 5, 7... are start of pairs
    if ((totalPoints - 1) % 2 === 0) {
      // Start of a new pair: alternate from starting server
      // Pair 0 (points 1-2): opposite
      // Pair 1 (points 3-4): starting
      // Pair 2 (points 5-6): opposite
      const isOddPair = (pairNumber % 2 === 0);
      s.serving_team = isOddPair ? otherTeam(s.tiebreak_starting_server) : s.tiebreak_starting_server;
    }
    // Otherwise, keep same server (middle of a pair)
  }
}

// ============================================================
// GAME/SET/MATCH COMPLETION HANDLERS
// ============================================================

function handleGameWon(s: MatchState, winner: Team, effects: Effect[]): ScoreResult {
  effects.push({ type: 'game_won', team: winner });
  
  // Increment games
  if (winner === 'a') {
    s.team_a_games++;
  } else {
    s.team_b_games++;
  }
  
  // Reset game points
  s.team_a_points = 0;
  s.team_b_points = 0;
  s.deuce_count = 0;
  
  // Check for tiebreak FIRST (before set win check)
  // Tiebreak starts when games reach tiebreak_at-tiebreak_at (e.g., 6-6)
  // We check AFTER incrementing games, so both teams have reached tiebreak_at
  if (s.team_a_games === s.tiebreak_at && s.team_b_games === s.tiebreak_at) {
    // Only start tiebreak if not already in one
    if (!s.is_tiebreak) {
      s.is_tiebreak = true;
      s.tiebreak_scores = { team_a: 0, team_b: 0 };
      // Record starting server for FIP rotation rules
      s.tiebreak_starting_server = s.serving_team || 'a';
      effects.push({ type: 'tiebreak_started' });
    }
    // Server stays the same for start of tiebreak
    return { newState: s, effects };
  }
  
  // Check for set win (after tiebreak check)
  // This handles 6-4, 7-5 etc where there's a 2 game lead
  const setWinner = checkSetWinner(s);
  if (setWinner) {
    return handleSetWon(s, setWinner, effects);
  }
  
  // Rotate server
  s.serving_team = otherTeam(s.serving_team!);
  
  return { newState: s, effects };
}

/**
 * Check if the current set has been won
 * Win condition: 6+ games and ahead by 2
 * Note: 6-6 goes to tiebreak, not checked here
 */
function checkSetWinner(s: MatchState): Team | null {
  const gA = s.team_a_games;
  const gB = s.team_b_games;
  
  // Standard set win: 6+ games, ahead by 2
  if (gA >= 6 && gA - gB >= 2) return 'a';
  if (gB >= 6 && gB - gA >= 2) return 'b';
  
  // 6-6 is handled by tiebreak, not here
  // 7-6 after tiebreak is handled in scoreTiebreakPoint
  
  return null;
}

function handleSetWon(s: MatchState, winner: Team, effects: Effect[]): ScoreResult {
  effects.push({ type: 'set_won', team: winner });
  
  // Record completed set
  s.set_scores.push({
    team_a: s.team_a_games,
    team_b: s.team_b_games
  });
  
  // Count sets won
  const setsWon = countSetsWon(s);
  
  // Check for match win
  if (setsWon[winner] >= s.sets_to_win) {
    return handleMatchWon(s, winner, effects);
  }
  
  // Start new set
  s.current_set++;
  s.team_a_games = 0;
  s.team_b_games = 0;
  s.team_a_points = 0;
  s.team_b_points = 0;
    s.is_tiebreak = false;
    s.tiebreak_scores = undefined;
    s.tiebreak_starting_server = undefined;
    s.deuce_count = 0;
  
  // Rotate server for new set
  s.serving_team = otherTeam(s.serving_team!);
  
  effects.push({ type: 'set_started', set_number: s.current_set });
  
  return { newState: s, effects };
}

function handleMatchWon(s: MatchState, winner: Team, effects: Effect[]): ScoreResult {
  effects.push({ type: 'match_won', team: winner });
  
  s.status = 'completed';
  s.winner = winner;
  s.completed_at = new Date().toISOString();
  
  return { newState: s, effects };
}

/**
 * Count sets won by each team
 */
function countSetsWon(s: MatchState): { a: number; b: number } {
  let a = 0;
  let b = 0;
  
  for (const set of s.set_scores) {
    if (set.team_a > set.team_b) a++;
    else if (set.team_b > set.team_a) b++;
  }
  
  return { a, b };
}

// ============================================================
// DISPLAY FORMATTING
// ============================================================

/**
 * Convert match state to display-friendly format
 */
export function formatDisplay(state: MatchState): DisplayModel {
  const pointLabels = ['0', '15', '30', '40'];
  
  let pointsA: string;
  let pointsB: string;
  let advantage: Team | null = null;
  let isDeuce = false;
  
  if (state.is_tiebreak) {
    // Tiebreak: show numeric scores
    if (state.tiebreak_scores) {
      pointsA = state.tiebreak_scores.team_a.toString();
      pointsB = state.tiebreak_scores.team_b.toString();
    } else {
      // Initialize if somehow missing
      pointsA = '0';
      pointsB = '0';
    }
  } else {
    const pA = state.team_a_points;
    const pB = state.team_b_points;
    
    // Check for deuce/advantage
    if (pA >= 3 && pB >= 3) {
      if (pA === pB) {
        pointsA = '40';
        pointsB = '40';
        isDeuce = true;
      } else if (pA > pB) {
        pointsA = 'Ad';
        pointsB = '40';
        advantage = 'a';
      } else {
        pointsA = '40';
        pointsB = 'Ad';
        advantage = 'b';
      }
    } else {
      pointsA = pointLabels[Math.min(pA, 3)];
      pointsB = pointLabels[Math.min(pB, 3)];
    }
  }
  
  // Build team names
  const teamAName = buildTeamName(state.team_a_player_1, state.team_a_player_2, 'Team A');
  const teamBName = buildTeamName(state.team_b_player_1, state.team_b_player_2, 'Team B');
  
  return {
    points: { a: pointsA, b: pointsB },
    games: { a: state.team_a_games, b: state.team_b_games },
    sets_won: countSetsWon(state),
    serving_team: state.serving_team,
    is_tiebreak: state.is_tiebreak,
    is_deuce: isDeuce,
    advantage,
    status: state.status,
    winner: state.winner,
    team_a_name: teamAName,
    team_b_name: teamBName,
    set_scores: state.set_scores,
  };
}

function buildTeamName(player1: string | null | undefined, player2: string | null | undefined, fallback: string): string {
  const names: string[] = [];
  if (player1) names.push(player1);
  if (player2) names.push(player2);
  
  if (names.length === 0) return fallback;
  if (names.length === 1) return names[0];
  return `${names[0]} / ${names[1]}`;
}

// ============================================================
// MATCH INITIALIZATION
// ============================================================

/**
 * Create initial match state
 */
export function createMatchState(config: {
  id: string;
  court_id: string;
  game_mode?: GameMode;
  sets_to_win?: 1 | 2;
  tiebreak_at?: 6 | 7;
  serving_team?: Team;
  team_a_player_1?: string;
  team_a_player_2?: string;
  team_b_player_1?: string;
  team_b_player_2?: string;
}): MatchState {
  return {
    id: config.id,
    court_id: config.court_id,
    version: 1,
    
    // Configuration
    game_mode: config.game_mode || 'golden_point',
    sets_to_win: config.sets_to_win || 1,
    tiebreak_at: config.tiebreak_at || 6,
    
    // Status
    status: 'setup',
    current_set: 1,
    is_tiebreak: false,
    
    // Scores
    team_a_points: 0,
    team_b_points: 0,
    team_a_games: 0,
    team_b_games: 0,
    set_scores: [],
    deuce_count: 0,
    
    // Serving
    serving_team: config.serving_team || (Math.random() > 0.5 ? 'a' : 'b'),
    
    // Players
    team_a_player_1: config.team_a_player_1 || null,
    team_a_player_2: config.team_a_player_2 || null,
    team_b_player_1: config.team_b_player_1 || null,
    team_b_player_2: config.team_b_player_2 || null,
    
    // Result
    winner: null,
    
    // Timestamps
    started_at: null,
    completed_at: null,
  };
}

// ============================================================
// UNDO SUPPORT
// ============================================================

/**
 * Check if undo is possible (state has meaningful changes)
 */
export function canUndo(currentState: MatchState, previousState: MatchState): boolean {
  // Can undo if match is in progress and states differ
  return currentState.status === 'in_progress' && 
         currentState.version > previousState.version;
}