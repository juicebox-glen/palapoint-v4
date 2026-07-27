import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'

export interface PalaLiveStaffSocialOverviewPlayer {
  name: string
  photoPreview: string | null
}

export interface PalaLiveStaffSocialOverviewProps {
  eventName: string
  formatLabel: string
  playerCount: number
  courtLabels: string[]
  players: PalaLiveStaffSocialOverviewPlayer[]
  error?: string | null
}

/** Review-before-start summary for the Social Night setup flow — shown after players are entered, before pairings generate. */
export function PalaLiveStaffSocialOverview({
  eventName,
  formatLabel,
  playerCount,
  courtLabels,
  players,
  error,
}: PalaLiveStaffSocialOverviewProps) {
  return (
    <div className="palalive-staff-body">
      <div className="palalive-staff-card">
        <span className="palalive-staff-card-label">Ready to Start</span>
        <div className="palalive-staff-overview-row">
          <span className="palalive-staff-overview-label">Event</span>
          <span className="palalive-staff-overview-value">{eventName}</span>
        </div>
        <div className="palalive-staff-overview-row">
          <span className="palalive-staff-overview-label">Format</span>
          <span className="palalive-staff-overview-value">{formatLabel}</span>
        </div>
        <div className="palalive-staff-overview-row">
          <span className="palalive-staff-overview-label">Players</span>
          <span className="palalive-staff-overview-value">{playerCount}</span>
        </div>
        <div className="palalive-staff-overview-row">
          <span className="palalive-staff-overview-label">Courts</span>
          <span className="palalive-staff-overview-value">{courtLabels.join(', ')}</span>
        </div>
      </div>

      <div className="palalive-staff-card">
        <div className="palalive-staff-card-label-row">
          <span className="palalive-staff-card-label">Roster</span>
          <span className="palalive-staff-chip">{players.length}</span>
        </div>
        {players.map((player, index) => (
          <div key={index} className="palalive-staff-standings-row">
            <PalaLiveAvatar name={player.name} photoUrl={player.photoPreview} />
            <div className="palalive-staff-standings-info">
              <span className="palalive-staff-standings-name">{player.name}</span>
            </div>
          </div>
        ))}
      </div>

      {error ? <p className="palalive-staff-error">{error}</p> : null}
    </div>
  )
}
