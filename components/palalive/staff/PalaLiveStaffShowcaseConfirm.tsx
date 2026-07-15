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

export interface PalaLiveStaffShowcaseConfirmProps {
  match: MatchState
  courtName: string
  onBackToEdit: () => void
  onStartMatch: () => void
  loading: boolean
  error?: string | null
}

export function PalaLiveStaffShowcaseConfirm({
  match,
  courtName,
  onBackToEdit,
  onStartMatch,
  loading,
  error,
}: PalaLiveStaffShowcaseConfirmProps) {
  const teamAPlayers = [
    { name: formatPlayerName(match.team_a_player_1, 'first'), photo: match.team_a_player_1_photo ?? null },
    { name: formatPlayerName(match.team_a_player_2, 'first'), photo: match.team_a_player_2_photo ?? null },
  ].filter((p) => p.name)
  const teamBPlayers = [
    { name: formatPlayerName(match.team_b_player_1, 'first'), photo: match.team_b_player_1_photo ?? null },
    { name: formatPlayerName(match.team_b_player_2, 'first'), photo: match.team_b_player_2_photo ?? null },
  ].filter((p) => p.name)

  return (
    <div className="palalive-staff-body">
      <div className="palalive-staff-status-row">
        <div className="palalive-staff-live">
          <span className="palalive-staff-live-dot" />
          Ready
        </div>
        <div className="palalive-staff-court">{courtName}</div>
      </div>

      {error ? <p className="palalive-staff-error">{error}</p> : null}

      <div className="palalive-staff-matchup-card">
        <div className="palalive-staff-matchup">
          <div className="palalive-staff-matchup-team">
            <div className="palalive-staff-matchup-avatars">
              {teamAPlayers.map((p) => (
                <PalaLiveAvatar key={p.name} name={p.name} photoUrl={p.photo} />
              ))}
            </div>
            <div className="palalive-staff-matchup-names">
              {teamAPlayers.map((p) => (
                <span key={p.name}>{p.name}</span>
              ))}
            </div>
          </div>
          <div className="palalive-staff-vs-col">
            <span className="palalive-staff-vs">VS</span>
          </div>
          <div className="palalive-staff-matchup-team">
            <div className="palalive-staff-matchup-avatars">
              {teamBPlayers.map((p) => (
                <PalaLiveAvatar key={p.name} name={p.name} photoUrl={p.photo} />
              ))}
            </div>
            <div className="palalive-staff-matchup-names">
              {teamBPlayers.map((p) => (
                <span key={p.name}>{p.name}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="palalive-staff-badges">
        <span className="palalive-staff-badge">{setsBadgeLabel(match.sets_to_win)}</span>
        <span className="palalive-staff-badge">{modeBadgeLabel(match.game_mode)}</span>
      </div>

      <div className="palalive-staff-footer">
        <button type="button" className="palalive-staff-btn palalive-staff-btn--secondary" onClick={onBackToEdit} disabled={loading}>
          Edit Match
        </button>
        <button type="button" className="palalive-staff-btn palalive-staff-btn--primary" onClick={onStartMatch} disabled={loading}>
          {loading ? '…' : 'Start Match'}
        </button>
      </div>
    </div>
  )
}
