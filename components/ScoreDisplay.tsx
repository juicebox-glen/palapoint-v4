'use client'

interface MatchState {
  id: string
  court_id: string
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{ team_a: number; team_b: number }>
  is_tiebreak: boolean
  tiebreak_scores?: { team_a: number; team_b: number }
  serving_team: 'a' | 'b' | null
  team_a_player_1?: string | null
  team_a_player_2?: string | null
  team_b_player_1?: string | null
  team_b_player_2?: string | null
  game_mode?: string
  current_set?: number
}

interface ScoreDisplayProps {
  match: MatchState
  variant?: 'court' | 'spectator'
}

function formatPointDisplay(
  points: number, 
  opponentPoints: number,
  isTiebreak: boolean, 
  tiebreakScore?: number
): string {
  if (isTiebreak && tiebreakScore !== undefined) {
    return tiebreakScore.toString()
  }
  
  const pointLabels = ['0', '15', '30', '40']
  
  // Standard points (0-3)
  if (points <= 3) {
    return pointLabels[points]
  }
  
  // Both teams at 3+ points (deuce situation)
  if (points >= 3 && opponentPoints >= 3) {
    // Advantage: this team is ahead by exactly 1
    if (points - opponentPoints === 1) {
      return 'Ad'
    }
    // Deuce: scores are equal
    if (points === opponentPoints) {
      return '40'
    }
    // Behind by 1: show 40 (opponent has advantage)
    if (opponentPoints - points === 1) {
      return '40'
    }
  }
  
  // Fallback: show 40 for any other case with 4+ points
  // (Game should have been won by this point, but handle gracefully)
  return '40'
}

function buildTeamName(player1: string | null | undefined, player2: string | null | undefined, fallback: string): string {
  const names: string[] = []
  if (player1) names.push(player1)
  if (player2) names.push(player2)
  
  if (names.length === 0) return fallback
  if (names.length === 1) return names[0]
  return `${names[0]} / ${names[1]}`
}

export default function ScoreDisplay({ match, variant = 'spectator' }: ScoreDisplayProps) {
  const teamAName = buildTeamName(match.team_a_player_1, match.team_a_player_2, 'Team A')
  const teamBName = buildTeamName(match.team_b_player_1, match.team_b_player_2, 'Team B')
  
  const pointsA = formatPointDisplay(
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const pointsB = formatPointDisplay(
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_b : undefined
  )
  
  const isCourt = variant === 'court'
  
  return (
    <div className={isCourt ? 'court-display' : 'spectator-display'}>
      {/* Team Names */}
      <div className={isCourt ? 'court-team-names' : 'spectator-team-names'}>
        <div className={isCourt ? 'court-team-name' : 'spectator-team-name'}>
          {teamAName}
          {match.serving_team === 'a' && <span className="serving-indicator">●</span>}
        </div>
        <div className={isCourt ? 'court-team-name' : 'spectator-team-name'}>
          {teamBName}
          {match.serving_team === 'b' && <span className="serving-indicator">●</span>}
        </div>
      </div>
      
      {/* Points */}
      <div className={isCourt ? 'court-points' : 'spectator-points'}>
        <div className={isCourt ? 'court-point' : 'spectator-point'}>{pointsA}</div>
        <div className={isCourt ? 'court-point' : 'spectator-point'}>{pointsB}</div>
      </div>
      
      {/* Games */}
      <div className={isCourt ? 'court-games' : 'spectator-games'}>
        <div className={isCourt ? 'court-game' : 'spectator-game'}>{match.team_a_games}</div>
        <div className={isCourt ? 'court-game' : 'spectator-game'}>{match.team_b_games}</div>
      </div>
      
      {/* Sets (spectator only) */}
      {!isCourt && match.set_scores && match.set_scores.length > 0 && (
        <div className="spectator-sets">
          <div className="spectator-sets-label">Sets:</div>
          <div className="spectator-sets-scores">
            {match.set_scores.map((set, idx) => (
              <div key={idx} className="spectator-set-score">
                {set.team_a} - {set.team_b}
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Game Mode (spectator only) */}
      {!isCourt && match.game_mode && (
        <div className="spectator-game-mode">
          Mode: {match.game_mode.replace('_', ' ')}
        </div>
      )}
      
      {/* Tiebreak indicator */}
      {match.is_tiebreak && (
        <div className={isCourt ? 'court-tiebreak' : 'spectator-tiebreak'}>
          TIEBREAK
        </div>
      )}
      
      <style jsx>{`
        .court-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: #000;
          color: #fff;
          gap: 2rem;
        }
        
        .spectator-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: #1a1a2e;
          color: #fff;
          padding: 2rem;
          gap: 1.5rem;
        }
        
        .court-team-names,
        .spectator-team-names {
          display: flex;
          gap: 4rem;
          font-size: ${isCourt ? '3rem' : '1.5rem'};
          font-weight: 600;
        }
        
        .court-team-name,
        .spectator-team-name {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .serving-indicator {
          color: #22c55e;
          font-size: ${isCourt ? '2rem' : '1rem'};
        }
        
        .court-points,
        .spectator-points {
          display: flex;
          gap: 8rem;
          font-size: ${isCourt ? '20rem' : '6rem'};
          font-weight: bold;
          line-height: 1;
        }
        
        .court-point,
        .spectator-point {
          min-width: ${isCourt ? '15rem' : '5rem'};
          text-align: center;
        }
        
        .court-games,
        .spectator-games {
          display: flex;
          gap: 4rem;
          font-size: ${isCourt ? '6rem' : '3rem'};
          font-weight: 600;
        }
        
        .court-game,
        .spectator-game {
          min-width: ${isCourt ? '8rem' : '4rem'};
          text-align: center;
        }
        
        .spectator-sets {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          font-size: 1.2rem;
        }
        
        .spectator-sets-label {
          font-weight: 600;
          opacity: 0.7;
        }
        
        .spectator-sets-scores {
          display: flex;
          gap: 1rem;
        }
        
        .spectator-set-score {
          padding: 0.5rem 1rem;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 0.5rem;
        }
        
        .spectator-game-mode {
          font-size: 1rem;
          opacity: 0.7;
          text-transform: capitalize;
        }
        
        .court-tiebreak,
        .spectator-tiebreak {
          font-size: ${isCourt ? '4rem' : '2rem'};
          font-weight: bold;
          color: #f59e0b;
          margin-top: 1rem;
        }
        
        @media (max-width: 768px) {
          .spectator-points {
            font-size: 4rem;
            gap: 2rem;
          }
          
          .spectator-games {
            font-size: 2rem;
            gap: 2rem;
          }
          
          .spectator-team-names {
            font-size: 1.2rem;
            gap: 2rem;
          }
        }
      `}</style>
    </div>
  )
}
