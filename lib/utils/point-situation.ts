import { MatchState } from '@/lib/types/match'

export interface PointSituation {
  type: 'SET POINT' | 'MATCH POINT' | 'GOLDEN POINT' | 'SILVER POINT'
  team: 'a' | 'b'
}

/**
 * Detect if either team is at set point or match point
 */
export function getPointSituation(match: MatchState): PointSituation | null {
  const { 
    team_a_points, 
    team_b_points, 
    team_a_games, 
    team_b_games, 
    is_tiebreak, 
    game_mode,
    sets_to_win,
    set_scores,
    tiebreak_at,
    deuce_count,
    tiebreak_scores
  } = match
  
  // Count sets won
  const setsWonA = (set_scores || []).filter((s) => s.team_a > s.team_b).length
  const setsWonB = (set_scores || []).filter((s) => s.team_b > s.team_a).length
  
  // Check if team is one set away from winning match
  const teamAOneSetFromMatch = setsWonA === (sets_to_win || 1) - 1
  const teamBOneSetFromMatch = setsWonB === (sets_to_win || 1) - 1
  
  // Games needed to win set
  const gamesNeeded = tiebreak_at || 6

  // In tiebreak: first to 7 with 2 point lead
  // Use tiebreak_scores instead of team_a_points/team_b_points
  if (is_tiebreak) {
    const tiebreakPointsA = tiebreak_scores?.team_a || 0
    const tiebreakPointsB = tiebreak_scores?.team_b || 0
    
    // Team A at tiebreak set/match point (6+ points and ahead)
    if (tiebreakPointsA >= 6 && tiebreakPointsA > tiebreakPointsB) {
      return { type: teamAOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'a' } as PointSituation
    }
    
    // Team B at tiebreak set/match point
    if (tiebreakPointsB >= 6 && tiebreakPointsB > tiebreakPointsA) {
      return { type: teamBOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'b' } as PointSituation
    }
    
    return null
  }
  
  // Golden Point: at deuce, next point wins
  if (game_mode === 'golden_point' && team_a_points >= 3 && team_b_points >= 3 && team_a_points === team_b_points) {
    // Check if winning this game would win the set
    const wouldWinSetA = (team_a_games + 1 >= gamesNeeded && team_a_games + 1 - team_b_games >= 2) ||
                          (team_a_games + 1 === 7 && team_b_games === 5)
    const wouldWinSetB = (team_b_games + 1 >= gamesNeeded && team_b_games + 1 - team_a_games >= 2) ||
                          (team_b_games + 1 === 7 && team_a_games === 5)
    
    if (wouldWinSetA) {
      return { type: teamAOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'a' }
    }
    if (wouldWinSetB) {
      return { type: teamBOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'b' }
    }
    return null
  }
  
  // Silver Point: second deuce, next point wins
  if (game_mode === 'silver_point' && team_a_points >= 3 && team_b_points >= 3 && team_a_points === team_b_points && (deuce_count || 0) >= 1) {
    const wouldWinSetA = (team_a_games + 1 >= gamesNeeded && team_a_games + 1 - team_b_games >= 2) ||
                          (team_a_games + 1 === 7 && team_b_games === 5)
    const wouldWinSetB = (team_b_games + 1 >= gamesNeeded && team_b_games + 1 - team_a_games >= 2) ||
                          (team_b_games + 1 === 7 && team_a_games === 5)
    
    if (wouldWinSetA) {
      return { type: teamAOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'a' }
    }
    if (wouldWinSetB) {
      return { type: teamBOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'b' }
    }
    return null
  }
  
  // Team at game point
  const teamAAtGamePoint = team_a_points >= 3 && team_a_points > team_b_points
  const teamBAtGamePoint = team_b_points >= 3 && team_b_points > team_a_points
  
  // Team A at game point - would winning this game win the set?
  if (teamAAtGamePoint) {
    const newGames = team_a_games + 1
    const wouldWinSet = (newGames >= gamesNeeded && newGames - team_b_games >= 2) ||
                        (newGames === 7 && team_b_games === 5)
    
    if (wouldWinSet) {
      return { type: teamAOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'a' }
    }
  }
  
  // Team B at game point
  if (teamBAtGamePoint) {
    const newGames = team_b_games + 1
    const wouldWinSet = (newGames >= gamesNeeded && newGames - team_a_games >= 2) ||
                        (newGames === 7 && team_a_games === 5)
    
    if (wouldWinSet) {
      return { type: teamBOneSetFromMatch ? 'MATCH POINT' : 'SET POINT', team: 'b' }
    }
  }
  
  return null
}
