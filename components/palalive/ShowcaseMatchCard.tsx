import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import { formatPlayerName } from '@/lib/utils/name-format'
import type { MatchState } from '@/lib/types/match'

interface ShowcaseMatchCardProps {
  match: MatchState
}

function TeamRows({
  player1,
  photo1,
  player2,
  photo2,
}: {
  player1?: string | null
  photo1?: string | null
  player2?: string | null
  photo2?: string | null
}) {
  const players = [
    { name: formatPlayerName(player1, 'full'), photo: photo1 ?? null },
    { name: formatPlayerName(player2, 'full'), photo: photo2 ?? null },
  ].filter((p) => p.name)

  return (
    <div className="palalive-match-team">
      {players.map((p) => (
        <div className="palalive-match-row" key={p.name}>
          <PalaLiveAvatar name={p.name} photoUrl={p.photo} />
          <span className="palalive-match-name">{p.name}</span>
        </div>
      ))}
    </div>
  )
}

export function ShowcaseMatchCard({ match }: ShowcaseMatchCardProps) {
  const isLive = match.status === 'in_progress'

  return (
    <div className="palalive-showcase-panel">
      <div className="palalive-stack-header">
        <span className="palalive-title-label">Now Playing</span>
        {isLive ? (
          <span className="palalive-title-label palalive-live-badge">
            <span className="palalive-live-dot" aria-hidden />
            Live
          </span>
        ) : null}
      </div>
      <div className="palalive-match-card-shell">
        <div className="palalive-match-card">
          <TeamRows
            player1={match.team_a_player_1}
            photo1={match.team_a_player_1_photo}
            player2={match.team_a_player_2}
            photo2={match.team_a_player_2_photo}
          />
          <div className="palalive-match-divider">vs</div>
          <TeamRows
            player1={match.team_b_player_1}
            photo1={match.team_b_player_1_photo}
            player2={match.team_b_player_2}
            photo2={match.team_b_player_2_photo}
          />
        </div>
      </div>
    </div>
  )
}
