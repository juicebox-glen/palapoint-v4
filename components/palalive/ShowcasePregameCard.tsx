import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import { formatPlayerName } from '@/lib/utils/name-format'
import type { MatchState } from '@/lib/types/match'

function modeBadgeLabel(mode: MatchState['game_mode']): string {
  if (mode === 'golden_point') return 'Golden Point'
  if (mode === 'silver_point') return 'Silver Point'
  return 'Standard'
}

function setsBadgeLabel(setsToWin: number): string {
  return setsToWin >= 2 ? '3 Sets' : '1 Set'
}

interface ShowcasePregameCardProps {
  match: MatchState
}

function PregameTeam({
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
    <div className="palalive-showcase-pregame__team">
      {players.map((p) => (
        <div className="palalive-showcase-pregame__player" key={p.name}>
          <PalaLiveAvatar name={p.name} photoUrl={p.photo} className="palalive-showcase-pregame__avatar" />
          <span className="palalive-showcase-pregame__name">{p.name}</span>
        </div>
      ))}
    </div>
  )
}

/** Build-up hero — main-stage slot for a 'setup'-status match, before the first point. */
export function ShowcasePregameCard({ match }: ShowcasePregameCardProps) {
  return (
    <div className="palalive-showcase-pregame">
      <span className="palalive-title-label">Starting Soon</span>
      <div className="palalive-showcase-pregame__matchup">
        <PregameTeam
          player1={match.team_a_player_1}
          photo1={match.team_a_player_1_photo}
          player2={match.team_a_player_2}
          photo2={match.team_a_player_2_photo}
        />
        <span className="palalive-showcase-pregame__vs">VS</span>
        <PregameTeam
          player1={match.team_b_player_1}
          photo1={match.team_b_player_1_photo}
          player2={match.team_b_player_2}
          photo2={match.team_b_player_2_photo}
        />
      </div>
      <div className="palalive-showcase-pregame__badges">
        <span className="palalive-showcase-pregame__badge">{setsBadgeLabel(match.sets_to_win ?? 1)}</span>
        <span className="palalive-showcase-pregame__badge">{modeBadgeLabel(match.game_mode)}</span>
      </div>
    </div>
  )
}
