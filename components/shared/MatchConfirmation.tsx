'use client'

import type { ReactNode } from 'react'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import type { MatchState, PlayerPhotosState } from '@/lib/types/match'
import { brandingStylesFor, type VenueBranding } from '@/lib/venue'
import { formatTeamDisplay } from '@/lib/utils/name-format'
import ControlScoreboard from '@/components/shared/ControlScoreboard'
import { MatchPreviewAvatar } from '@/components/shared/MatchPreviewAvatar'
import { modeBadgeLabel, setsBadgeLabel } from '@/lib/utils/match-labels'
import '@/app/styles/setup-form.css'
import '@/app/styles/control-panel.css'

/** @deprecated Use setsBadgeLabel from lib/utils/match-labels */
export const matchPreviewSetsBadgeLabel = setsBadgeLabel

/** @deprecated Use modeBadgeLabel from lib/utils/match-labels */
export const matchPreviewModeBadgeLabel = modeBadgeLabel

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
  /** Bottom CTA area (wrapped in `.preview-actions`). Omit when empty (e.g. LIVE player view). */
  actions?: ReactNode
  /** Pin headline + actions to bottom with scrollable matchup above (player ready / setup confirmation). */
  idleFooterLayout?: boolean
  /** Centered hero + edit link while awaiting court ack (replaces primaryMessage/actions footer). */
  readyStateFooter?: ReactNode
  /** Live play: same `.control-scoreboard` as staff control (replaces VS matchup card). */
  scoreboardMatch?: MatchState | null
  /** Adds `.control-panel--player` for player-route spacing. */
  playerView?: boolean
}

export default function MatchConfirmation({
  match,
  branding,
  courtName,
  error,
  statusLabel = 'READY',
  primaryMessage,
  actions,
  idleFooterLayout = false,
  readyStateFooter,
  scoreboardMatch,
  playerView = false,
}: MatchConfirmationProps) {
  const previewInner = (
    <>
      <SetupScreenHeader branding={branding} />

      <div className="preview-header">
        <div className="preview-status">
          <span className="preview-status-dot" aria-hidden />
          <span>{statusLabel}</span>
        </div>
        <div className="preview-court">{courtName}</div>
      </div>

      {error && <div className="control-error-message">{error}</div>}

      {scoreboardMatch ? (
        <ControlScoreboard match={scoreboardMatch} />
      ) : (
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
              <div className="preview-team-names preview-team-names--headline">
                <span>
                  {formatTeamDisplay(match.team_a_player_1, match.team_a_player_2, 1)}
                </span>
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
              <div className="preview-team-names preview-team-names--headline">
                <span>
                  {formatTeamDisplay(match.team_b_player_1, match.team_b_player_2, 2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="preview-badges">
        <span className="preview-badge">{matchPreviewSetsBadgeLabel(match.sets_to_win)}</span>
        <span className="preview-badge">{matchPreviewModeBadgeLabel(match.game_mode)}</span>
      </div>
    </>
  )

  const hasPrimary =
    primaryMessage != null && primaryMessage !== false
  const hasActions = actions != null && actions !== false
  const showFooter = !readyStateFooter && (hasPrimary || hasActions)

  const footer = showFooter ? (
    <div className={`preview-footer ${idleFooterLayout ? 'playing-idle-footer' : ''}`}>
      {hasPrimary && (
        <div
          className={`preview-primary-message ${idleFooterLayout ? 'playing-idle-message' : ''}`}
        >
          {primaryMessage}
        </div>
      )}
      {hasActions && <div className="preview-actions">{actions}</div>}
    </div>
  ) : null

  return (
    <div
      className={`control-panel${playerView ? ' control-panel--player' : ''}`}
      style={brandingStylesFor(branding)}
    >
      <div className="control-container control-container--preview">
        <div
          className={`control-preview ${idleFooterLayout ? 'control-preview--playing-idle' : ''}${
            readyStateFooter ? ' control-preview--playing-ready' : ''
          }`}
        >
          {idleFooterLayout ? (
            <>
              <div className="playing-idle-content">{previewInner}</div>
              {readyStateFooter ?? footer}
            </>
          ) : (
            <>
              {previewInner}
              {footer}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
