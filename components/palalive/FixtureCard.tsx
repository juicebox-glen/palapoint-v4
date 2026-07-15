import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import type { SocialNightMatch } from '@/lib/palalive/social-types'

interface FixtureCardProps {
  match: SocialNightMatch
  /** Matches the active right-panel substate so the fixture shell stays visually consistent. */
  variant: 'pregame' | 'ingame' | 'postgame'
}

function TeamSide({ players, score, isCompleted, isWinner }: {
  players: SocialNightMatch['teamA']['players']
  score: number | null
  isCompleted: boolean
  isWinner: boolean
}) {
  return (
    <div className="palalive-court-team">
      <div className="palalive-court-names">
        {players.map((p) => (
          <span key={p.name}>{p.name}</span>
        ))}
      </div>
      {isCompleted ? (
        <span className={`palalive-result-avatar${isWinner ? ' is-winner' : ''}`}>{score ?? 0}</span>
      ) : (
        <div className="palalive-court-avatars">
          {players.map((p) => (
            <PalaLiveAvatar key={p.name} name={p.name} photoUrl={p.photoUrl} />
          ))}
        </div>
      )}
    </div>
  )
}

export function FixtureCard({ match, variant }: FixtureCardProps) {
  const cardClass =
    variant === 'ingame'
      ? 'palalive-court-card palalive-court-card--solid'
      : variant === 'postgame'
        ? 'palalive-court-card palalive-court-card--final'
        : 'palalive-court-card'

  const isCompleted = match.status === 'completed'
  const teamAWins = isCompleted && (match.teamA.score ?? 0) > (match.teamB.score ?? 0)
  const teamBWins = isCompleted && (match.teamB.score ?? 0) > (match.teamA.score ?? 0)

  return (
    <div className={cardClass}>
      <div className="palalive-court-header">
        <span className="palalive-title-label">Court</span>
        <span className="palalive-court-number">{match.courtLabel}</span>
      </div>
      <div className="palalive-court-match">
        <TeamSide players={match.teamA.players} score={match.teamA.score} isCompleted={isCompleted} isWinner={teamAWins} />
        <div className="palalive-match-divider">vs</div>
        <TeamSide players={match.teamB.players} score={match.teamB.score} isCompleted={isCompleted} isWinner={teamBWins} />
      </div>
    </div>
  )
}
