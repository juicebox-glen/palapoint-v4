// ============================================================
// PALAPOINT V4 - SCORING ENGINE TESTS
// Run with: npx ts-node lib/scoring/engine.test.ts
// ============================================================

import { applyScore, createMatchState, formatDisplay } from './engine';
import { MatchState, ScoreEvent, Team, GameMode } from './types';

// ============================================================
// TEST UTILITIES
// ============================================================

let testsPassed = 0;
let testsFailed = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error: any) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${error.message}`);
    testsFailed++;
  }
}

function assertEqual<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

function scorePoints(state: MatchState, points: Team[]): MatchState {
  let s = state;
  for (const team of points) {
    const result = applyScore(s, { type: 'point', team });
    s = result.newState;
  }
  return s;
}

// Helper to quickly score a game
function scoreGame(state: MatchState, winner: Team): MatchState {
  // Score 4 points for winner (0-15-30-40-game)
  return scorePoints(state, [winner, winner, winner, winner]);
}

// ============================================================
// BASIC POINT SCORING TESTS
// ============================================================

console.log('\n=== Basic Point Scoring ===\n');

test('Initial state has zero scores', () => {
  const state = createMatchState({ id: 'test', court_id: 'court1' });
  assertEqual(state.team_a_points, 0);
  assertEqual(state.team_b_points, 0);
  assertEqual(state.team_a_games, 0);
  assertEqual(state.team_b_games, 0);
  assertEqual(state.status, 'setup');
});

test('Scoring a point increments correctly', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  const result = applyScore(state, { type: 'point', team: 'a' });
  assertEqual(result.newState.team_a_points, 1);
  assertEqual(result.newState.team_b_points, 0);
  assertEqual(result.newState.status, 'in_progress');
});

test('Point progression: 0 -> 15 -> 30 -> 40', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  
  // Score 3 points for team A
  state = scorePoints(state, ['a', 'a', 'a']);
  
  const display = formatDisplay(state);
  assertEqual(display.points.a, '40');
  assertEqual(display.points.b, '0');
});

// ============================================================
// GAME WIN TESTS
// ============================================================

console.log('\n=== Game Win Tests ===\n');

test('Team A wins game with 4 points (love game)', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  state = scorePoints(state, ['a', 'a', 'a', 'a']);
  
  assertEqual(state.team_a_games, 1);
  assertEqual(state.team_b_games, 0);
  assertEqual(state.team_a_points, 0); // Reset after game
  assertEqual(state.team_b_points, 0);
});

test('Team B wins game', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  state = scorePoints(state, ['b', 'b', 'b', 'b']);
  
  assertEqual(state.team_a_games, 0);
  assertEqual(state.team_b_games, 1);
});

test('Server rotates after game', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1', serving_team: 'a' });
  state = scoreGame(state, 'a');
  
  assertEqual(state.serving_team, 'b');
});

// ============================================================
// DEUCE TESTS - TRADITIONAL (ADVANTAGE)
// ============================================================

console.log('\n=== Deuce Tests - Traditional ===\n');

test('Deuce at 40-40 (Traditional)', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'traditional'
  });
  
  // Get to 40-40
  state = scorePoints(state, ['a', 'a', 'a', 'b', 'b', 'b']);
  
  const display = formatDisplay(state);
  assertEqual(display.points.a, '40');
  assertEqual(display.points.b, '40');
  assertEqual(display.is_deuce, true);
});

test('Advantage after deuce (Traditional)', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'traditional'
  });
  
  // Get to deuce, then A scores
  state = scorePoints(state, ['a', 'a', 'a', 'b', 'b', 'b', 'a']);
  
  const display = formatDisplay(state);
  assertEqual(display.points.a, 'Ad');
  assertEqual(display.points.b, '40');
  assertEqual(display.advantage, 'a');
});

test('Back to deuce from advantage (Traditional)', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'traditional'
  });
  
  // Deuce -> Ad A -> Deuce
  state = scorePoints(state, ['a', 'a', 'a', 'b', 'b', 'b', 'a', 'b']);
  
  const display = formatDisplay(state);
  assertEqual(display.points.a, '40');
  assertEqual(display.points.b, '40');
  assertEqual(display.is_deuce, true);
});

test('Win from advantage (Traditional)', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'traditional'
  });
  
  // Deuce -> Ad A -> Game A
  state = scorePoints(state, ['a', 'a', 'a', 'b', 'b', 'b', 'a', 'a']);
  
  assertEqual(state.team_a_games, 1);
  assertEqual(state.team_a_points, 0); // Reset
});

// ============================================================
// DEUCE TESTS - GOLDEN POINT
// ============================================================

console.log('\n=== Deuce Tests - Golden Point ===\n');

test('Golden point wins immediately at deuce', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'golden_point'
  });
  
  // Get to deuce, then A scores - should win immediately
  state = scorePoints(state, ['a', 'a', 'a', 'b', 'b', 'b', 'a']);
  
  assertEqual(state.team_a_games, 1);
  assertEqual(state.team_a_points, 0); // Reset after game win
});

// ============================================================
// DEUCE TESTS - SILVER POINT
// ============================================================

console.log('\n=== Deuce Tests - Silver Point ===\n');

test('Silver point: first deuce plays advantage', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'silver_point'
  });
  
  // Get to deuce, A scores - should get advantage (first deuce)
  state = scorePoints(state, ['a', 'a', 'a', 'b', 'b', 'b', 'a']);
  
  // Game should NOT be won yet
  assertEqual(state.team_a_games, 0);
  
  const display = formatDisplay(state);
  assertEqual(display.advantage, 'a');
});

test('Silver point: second deuce is sudden death', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    game_mode: 'silver_point'
  });
  
  // Deuce 1 -> Ad A -> Deuce 2 -> A scores (sudden death)
  state = scorePoints(state, [
    'a', 'a', 'a', 'b', 'b', 'b',  // First deuce
    'a',                            // Ad A
    'b',                            // Back to deuce (second)
    'a'                             // Should win (sudden death)
  ]);
  
  assertEqual(state.team_a_games, 1);
});

// ============================================================
// SET WIN TESTS
// ============================================================

console.log('\n=== Set Win Tests ===\n');

test('Win set at 6-0', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  
  // Win 6 games for team A
  for (let i = 0; i < 6; i++) {
    state = scoreGame(state, 'a');
  }
  
  assertEqual(state.set_scores.length, 1);
  assertEqual(state.set_scores[0], { team_a: 6, team_b: 0 });
});

test('Win set at 6-4', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  
  // A wins 5, B wins 4, A wins 1 more
  for (let i = 0; i < 5; i++) state = scoreGame(state, 'a');
  for (let i = 0; i < 4; i++) state = scoreGame(state, 'b');
  state = scoreGame(state, 'a');
  
  assertEqual(state.set_scores.length, 1);
  assertEqual(state.set_scores[0], { team_a: 6, team_b: 4 });
});

test('No set win at 6-5 (need 2 game lead)', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  
  // Get to 6-5
  for (let i = 0; i < 5; i++) state = scoreGame(state, 'a');
  for (let i = 0; i < 5; i++) state = scoreGame(state, 'b');
  state = scoreGame(state, 'a'); // 6-5
  
  assertEqual(state.set_scores.length, 0); // Set not yet complete
  assertEqual(state.team_a_games, 6);
  assertEqual(state.team_b_games, 5);
});

test('Win set at 7-5', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  
  // Get to 6-5, then 7-5
  for (let i = 0; i < 5; i++) state = scoreGame(state, 'a');
  for (let i = 0; i < 5; i++) state = scoreGame(state, 'b');
  state = scoreGame(state, 'a'); // 6-5
  state = scoreGame(state, 'a'); // 7-5
  
  assertEqual(state.set_scores.length, 1);
  assertEqual(state.set_scores[0], { team_a: 7, team_b: 5 });
});

// ============================================================
// TIEBREAK TESTS
// ============================================================

console.log('\n=== Tiebreak Tests ===\n');

test('Tiebreak starts at 6-6', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1', tiebreak_at: 6 });
  
  // Get to 6-6 by alternating games (so we don't win the set early)
  // Score 5 games for each team first (5-5)
  for (let i = 0; i < 5; i++) {
    state = scoreGame(state, 'a');
    state = scoreGame(state, 'b');
  }
  // Now score one more game for each to reach 6-6
  state = scoreGame(state, 'a');
  state = scoreGame(state, 'b');
  
  assertEqual(state.is_tiebreak, true);
  assertEqual(state.team_a_games, 6);
  assertEqual(state.team_b_games, 6);
});

test('Win tiebreak at 7-0', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1', tiebreak_at: 6 });
  
  // Get to tiebreak by alternating games
  for (let i = 0; i < 5; i++) {
    state = scoreGame(state, 'a');
    state = scoreGame(state, 'b');
  }
  state = scoreGame(state, 'a');
  state = scoreGame(state, 'b'); // Now at 6-6, tiebreak should start
  
  // Win tiebreak 7-0
  for (let i = 0; i < 7; i++) {
    const result = applyScore(state, { type: 'point', team: 'a' });
    state = result.newState;
  }
  
  assertEqual(state.is_tiebreak, false);
  assertEqual(state.set_scores.length, 1);
  assertEqual(state.set_scores[0], { team_a: 7, team_b: 6 });
});

test('Tiebreak needs win by 2', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1', tiebreak_at: 6 });
  
  // Get to tiebreak by alternating games
  for (let i = 0; i < 5; i++) {
    state = scoreGame(state, 'a');
    state = scoreGame(state, 'b');
  }
  state = scoreGame(state, 'a');
  state = scoreGame(state, 'b'); // Now at 6-6, tiebreak should start
  
  // Get to 6-6 in tiebreak
  for (let i = 0; i < 6; i++) {
    state = applyScore(state, { type: 'point', team: 'a' }).newState;
    state = applyScore(state, { type: 'point', team: 'b' }).newState;
  }
  
  // Should still be in tiebreak
  assertEqual(state.is_tiebreak, true);
  assertEqual(state.tiebreak_scores?.team_a, 6);
  assertEqual(state.tiebreak_scores?.team_b, 6);
  
  // Win 8-6
  state = applyScore(state, { type: 'point', team: 'a' }).newState; // 7-6
  assertEqual(state.is_tiebreak, true); // Still in tiebreak (need win by 2)
  
  state = applyScore(state, { type: 'point', team: 'a' }).newState; // 8-6
  assertEqual(state.is_tiebreak, false);
  assertEqual(state.set_scores.length, 1);
});

// ============================================================
// MATCH WIN TESTS
// ============================================================

console.log('\n=== Match Win Tests ===\n');

test('Win 1-set match', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    sets_to_win: 1
  });
  
  // Win 6 games
  for (let i = 0; i < 6; i++) {
    state = scoreGame(state, 'a');
  }
  
  assertEqual(state.status, 'completed');
  assertEqual(state.winner, 'a');
});

test('Win best-of-3 match', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    sets_to_win: 2
  });
  
  // Win first set 6-0
  for (let i = 0; i < 6; i++) state = scoreGame(state, 'a');
  assertEqual(state.set_scores.length, 1);
  assertEqual(state.status, 'in_progress');
  
  // Win second set 6-0
  for (let i = 0; i < 6; i++) state = scoreGame(state, 'a');
  
  assertEqual(state.status, 'completed');
  assertEqual(state.winner, 'a');
  assertEqual(state.set_scores.length, 2);
});

test('Cannot score after match finished', () => {
  let state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    sets_to_win: 1
  });
  
  // Win match
  for (let i = 0; i < 6; i++) state = scoreGame(state, 'a');
  assertEqual(state.status, 'completed');
  
  // Try to score more
  const result = applyScore(state, { type: 'point', team: 'b' });
  
  // State should be unchanged
  assertEqual(result.newState.team_b_points, 0);
  assertEqual(result.effects.length, 0);
});

// ============================================================
// DISPLAY FORMAT TESTS
// ============================================================

console.log('\n=== Display Format Tests ===\n');

test('Display shows correct point labels', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1' });
  
  assertEqual(formatDisplay(state).points.a, '0');
  
  state = applyScore(state, { type: 'point', team: 'a' }).newState;
  assertEqual(formatDisplay(state).points.a, '15');
  
  state = applyScore(state, { type: 'point', team: 'a' }).newState;
  assertEqual(formatDisplay(state).points.a, '30');
  
  state = applyScore(state, { type: 'point', team: 'a' }).newState;
  assertEqual(formatDisplay(state).points.a, '40');
});

test('Display shows team names', () => {
  const state = createMatchState({ 
    id: 'test', 
    court_id: 'court1',
    team_a_player_1: 'Smith',
    team_a_player_2: 'Jones',
    team_b_player_1: 'Garcia'
  });
  
  const display = formatDisplay(state);
  assertEqual(display.team_a_name, 'Smith / Jones');
  assertEqual(display.team_b_name, 'Garcia');
});

test('Display shows tiebreak scores as numbers', () => {
  let state = createMatchState({ id: 'test', court_id: 'court1', tiebreak_at: 6 });
  
  // Get to tiebreak by alternating games
  for (let i = 0; i < 5; i++) {
    state = scoreGame(state, 'a');
    state = scoreGame(state, 'b');
  }
  state = scoreGame(state, 'a');
  state = scoreGame(state, 'b'); // Now at 6-6, tiebreak should start
  
  // Score some tiebreak points
  state = applyScore(state, { type: 'point', team: 'a' }).newState;
  state = applyScore(state, { type: 'point', team: 'b' }).newState;
  state = applyScore(state, { type: 'point', team: 'a' }).newState;
  
  const display = formatDisplay(state);
  assertEqual(display.points.a, '2');
  assertEqual(display.points.b, '1');
  assertEqual(display.is_tiebreak, true);
});

// ============================================================
// SUMMARY
// ============================================================

console.log('\n========================================');
console.log(`Tests passed: ${testsPassed}`);
console.log(`Tests failed: ${testsFailed}`);
console.log('========================================\n');

if (testsFailed > 0) {
  process.exit(1);
}
