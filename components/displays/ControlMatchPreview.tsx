'use client'

import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import SetupScreenHeader from '@/components/SetupScreenHeader'

function previewInitial(name: string | null | undefined) {
  const t = name?.trim()
  if (!t) return '?'
  return t.charAt(0).toUpperCase()
}

function previewDisplayName(name: string | null | undefined, fallback: string) {
  const t = name?.trim()
  return t || fallback
}

function modeLabel(mode: MatchState['game_mode']) {
  if (mode === 'golden_point') return 'GOLDEN POINT'
  if (mode === 'silver_point') return 'SILVER POINT'
  return 'TRADITIONAL'
}

interface ControlMatchPreviewProps {
  match: MatchState
  branding?: VenueBranding | null
  onBack: () => void
  onStart: () => void
  loading?: boolean
  error?: string | null
}

export default function ControlMatchPreview({
  match,
  branding,
  onBack,
  onStart,
  loading,
  error,
}: ControlMatchPreviewProps) {
  const setsLabel = (match.sets_to_win ?? 1) === 2 ? 'Best of 3 sets' : '1 set'

  return (
    <div className="control-panel">
      <div className="control-container">
        <SetupScreenHeader branding={branding} />

        <div className="control-preview">
          <div className="preview-header">
            <span className="preview-badge">PREVIEW</span>
          </div>

          {error && <div className="control-error-message">{error}</div>}

          <div className="preview-matchup">
            <div className="preview-team preview-team-a">
              <div className="preview-player">
                {match.team_a_player_1_photo ? (
                  <img
                    src={match.team_a_player_1_photo}
                    alt=""
                    className="preview-photo"
                  />
                ) : (
                  <div className="preview-avatar" aria-hidden>
                    {previewInitial(match.team_a_player_1)}
                  </div>
                )}
                <span className="preview-name">
                  {previewDisplayName(match.team_a_player_1, 'Player 1')}
                </span>
              </div>
              <div className="preview-player">
                {match.team_a_player_2_photo ? (
                  <img
                    src={match.team_a_player_2_photo}
                    alt=""
                    className="preview-photo"
                  />
                ) : (
                  <div className="preview-avatar" aria-hidden>
                    {previewInitial(match.team_a_player_2)}
                  </div>
                )}
                <span className="preview-name">
                  {previewDisplayName(match.team_a_player_2, 'Player 2')}
                </span>
              </div>
            </div>

            <div className="preview-vs">VS</div>

            <div className="preview-team preview-team-b">
              <div className="preview-player">
                {match.team_b_player_1_photo ? (
                  <img
                    src={match.team_b_player_1_photo}
                    alt=""
                    className="preview-photo"
                  />
                ) : (
                  <div className="preview-avatar" aria-hidden>
                    {previewInitial(match.team_b_player_1)}
                  </div>
                )}
                <span className="preview-name">
                  {previewDisplayName(match.team_b_player_1, 'Player 1')}
                </span>
              </div>
              <div className="preview-player">
                {match.team_b_player_2_photo ? (
                  <img
                    src={match.team_b_player_2_photo}
                    alt=""
                    className="preview-photo"
                  />
                ) : (
                  <div className="preview-avatar" aria-hidden>
                    {previewInitial(match.team_b_player_2)}
                  </div>
                )}
                <span className="preview-name">
                  {previewDisplayName(match.team_b_player_2, 'Player 2')}
                </span>
              </div>
            </div>
          </div>

          <div className="preview-meta">
            <div className="preview-mode-badge">{modeLabel(match.game_mode)}</div>
            <div className="preview-sets-badge">{setsLabel}</div>
          </div>

          <div className="preview-actions">
            <button
              type="button"
              className="control-button"
              onClick={onBack}
              disabled={!!loading}
            >
              Back to Edit
            </button>
            <button
              type="button"
              className="control-button control-button-primary"
              onClick={onStart}
              disabled={!!loading}
            >
              {loading ? 'Starting…' : 'Start Match'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
