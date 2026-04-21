'use client'

import type { ReactNode } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import type { MatchState, PlayerPhotosState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import { formatNameAbbreviated } from '@/lib/utils/player-names'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import '@/app/styles/control-panel.css'

export function matchPreviewSetsBadgeLabel(setsToWin: number | null | undefined): string {
  const n = setsToWin ?? 1
  return n > 1 ? '3 SETS' : '1 SET'
}

export function matchPreviewModeBadgeLabel(mode: MatchState['game_mode']): string {
  if (mode === 'golden_point') return 'GOLDEN'
  if (mode === 'silver_point') return 'SILVER'
  return 'TRADITIONAL'
}

/** Minimal match fields for the confirmation / live playing preview layout. */
export type MatchConfirmationMatch = Pick<MatchState, 'game_mode' | 'sets_to_win'> &
  Partial<PlayerPhotosState> & {
    team_a_player_1?: string | null
    team_a_player_2?: string | null
    team_b_player_1?: string | null
    team_b_player_2?: string | null
  }

export interface MatchConfirmationProps {
  match: MatchConfirmationMatch
  branding?: VenueBranding | null
  courtName: string
  error?: string | null
  /** Status row label next to the green dot (e.g. READY, LIVE). */
  statusLabel?: string
  /** Rendered after setting badges, before the action buttons. */
  primaryMessage?: ReactNode
  /** Bottom CTA area (wrapped in `.preview-actions`). */
  actions: ReactNode
}

export default function MatchConfirmation({
  match,
  branding,
  courtName,
  error,
  statusLabel = 'READY',
  primaryMessage,
  actions,
}: MatchConfirmationProps) {
  return (
    <div className="control-panel">
      <div className="control-container control-container--preview">
        <div className="control-preview">
          <SetupScreenHeader branding={branding} />

          <div className="preview-header">
            <div className="preview-status">
              <span className="preview-status-dot" aria-hidden />
              <span>{statusLabel}</span>
            </div>
            <div className="preview-court">{courtName}</div>
          </div>

          {error && <div className="control-error-message">{error}</div>}

          <div className="preview-card">
            <div className="preview-matchup">
              <div className="preview-team preview-team-a">
                <div className="preview-team-avatars">
                  <MatchPreviewAvatar
                    photo={match.team_a_player_1_photo}
                    name={match.team_a_player_1}
                    team="a"
                  />
                  <MatchPreviewAvatar
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
                  <MatchPreviewAvatar
                    photo={match.team_b_player_1_photo}
                    name={match.team_b_player_1}
                    team="b"
                  />
                  <MatchPreviewAvatar
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
            <span className="preview-badge">{matchPreviewSetsBadgeLabel(match.sets_to_win)}</span>
            <span className="preview-badge">{matchPreviewModeBadgeLabel(match.game_mode)}</span>
          </div>

          <div className="preview-footer">
            {primaryMessage != null && primaryMessage !== false && (
              <div className="preview-primary-message">{primaryMessage}</div>
            )}
            <div className="preview-actions">{actions}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
