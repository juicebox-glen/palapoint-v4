'use client'

import SetupScreenHeader from '@/components/SetupScreenHeader'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import { formatNameAbbreviated, getPlayerInitials } from '@/lib/utils/player-names'

function PreviewAvatar({
  photo,
  name,
  team,
}: {
  photo?: string | null
  name?: string | null
  team: 'a' | 'b'
}) {
  const initials = getPlayerInitials(name)

  return (
    <div className={`preview-avatar preview-avatar-${team}`}>
      {photo ? (
        <img src={photo} alt={name?.trim() || 'Player'} />
      ) : (
        <span className="preview-avatar-initials">{initials}</span>
      )}
    </div>
  )
}

function setsBadgeLabel(setsToWin: number | null | undefined): string {
  const n = setsToWin ?? 1
  return n > 1 ? '3 SETS' : '1 SET'
}

function modeBadgeLabel(mode: MatchState['game_mode']): string {
  if (mode === 'golden_point') return 'GOLDEN'
  if (mode === 'silver_point') return 'SILVER'
  return 'TRADITIONAL'
}

interface ControlMatchPreviewProps {
  match: MatchState
  branding?: VenueBranding | null
  courtName: string
  onBackToEdit: () => void
  onStartMatch: () => void
  loading?: boolean
  error?: string | null
}

export default function ControlMatchPreview({
  match,
  branding,
  courtName,
  onBackToEdit,
  onStartMatch,
  loading,
  error,
}: ControlMatchPreviewProps) {
  return (
    <div className="control-panel">
      <div className="control-container control-container--preview">
        <div className="control-preview">
          <SetupScreenHeader branding={branding} />

          <div className="preview-header">
            <div className="preview-status">
              <span className="preview-status-dot" aria-hidden />
              <span>READY</span>
            </div>
            <div className="preview-court">{courtName}</div>
          </div>

          {error && <div className="control-error-message">{error}</div>}

          <div className="preview-card">
            <div className="preview-matchup">
              <div className="preview-team preview-team-a">
                <div className="preview-team-avatars">
                  <PreviewAvatar
                    photo={match.team_a_player_1_photo}
                    name={match.team_a_player_1}
                    team="a"
                  />
                  <PreviewAvatar
                    photo={match.team_a_player_2_photo}
                    name={match.team_a_player_2}
                    team="a"
                  />
                </div>
                <div className="preview-team-names">
                  <span>{formatNameAbbreviated(match.team_a_player_1)}</span>
                  <span>{formatNameAbbreviated(match.team_a_player_2)}</span>
                </div>
              </div>

              <div className="preview-vs-column">
                <span className="preview-vs">VS</span>
              </div>

              <div className="preview-team preview-team-b">
                <div className="preview-team-avatars">
                  <PreviewAvatar
                    photo={match.team_b_player_1_photo}
                    name={match.team_b_player_1}
                    team="b"
                  />
                  <PreviewAvatar
                    photo={match.team_b_player_2_photo}
                    name={match.team_b_player_2}
                    team="b"
                  />
                </div>
                <div className="preview-team-names">
                  <span>{formatNameAbbreviated(match.team_b_player_1)}</span>
                  <span>{formatNameAbbreviated(match.team_b_player_2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="preview-badges">
            <span className="preview-badge">{setsBadgeLabel(match.sets_to_win)}</span>
            <span className="preview-badge">{modeBadgeLabel(match.game_mode)}</span>
          </div>

          <div className="preview-actions">
            <button
              type="button"
              className="preview-btn preview-btn-secondary"
              onClick={onBackToEdit}
              disabled={!!loading}
            >
              EDIT MATCH
            </button>
            <button
              type="button"
              className="preview-btn preview-btn-primary"
              onClick={onStartMatch}
              disabled={!!loading}
            >
              {loading ? 'STARTING…' : 'START MATCH'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
