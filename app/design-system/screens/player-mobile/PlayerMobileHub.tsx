'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

import { DEFAULT_GAME_PREVIEW_ID } from '../../lib/game-preview-data'

type FlowTab = 'staff' | 'player'

const STAFF_MATCH_FLOW_TABS: ScreenPreviewState[] = [
  { name: 'loading', label: 'Loading', url: '/design-system/preview/control?state=loading' },
  { name: 'setup', label: 'Setup', url: '/design-system/preview/control?state=setup' },
  { name: 'preview', label: 'Preview', url: '/design-system/preview/control?state=preview' },
  { name: 'live', label: 'Live', url: '/design-system/preview/control?state=live' },
  { name: 'endgame', label: 'End', url: '/design-system/preview/control?state=endgame' },
  {
    name: 'end_multi',
    label: 'End 2-1',
    url: '/design-system/preview/control?state=endgame_multi',
  },
  {
    name: 'end_sweep',
    label: 'End 2-0',
    url: '/design-system/preview/control?state=endgame_sweep',
  },
  {
    name: 'end_confirm',
    label: 'End match?',
    url: '/design-system/preview/control?state=end_confirm',
  },
]

/** Player flow in the order users see it on `/setup` → `/playing` → session summary. */
const PLAYER_MATCH_FLOW_TABS: ScreenPreviewState[] = [
  {
    name: 'checking_court',
    label: 'Checking',
    url: '/design-system/preview/setup?state=checking_court',
  },
  {
    name: 'court_in_use',
    label: 'Court in use',
    url: '/design-system/preview/setup?state=session_prompt',
  },
  { name: 'setup', label: 'Setup', url: '/design-system/preview/setup?state=form' },
  { name: 'ready', label: 'Ready', url: '/design-system/preview/setup?state=confirmation' },
  { name: 'live', label: 'Live', url: '/design-system/preview/playing?state=live' },
  { name: 'endgame', label: 'End', url: '/design-system/preview/playing?state=postgame_win' },
  {
    name: 'end_multi',
    label: 'End 2-1',
    url: '/design-system/preview/playing?state=postgame_win_3split',
  },
  {
    name: 'end_sweep',
    label: 'End 2-0',
    url: '/design-system/preview/playing?state=postgame_win_3sweep',
  },
  {
    name: 'session_review',
    label: 'Summary',
    url: '/design-system/preview/session-review',
  },
  {
    name: 'game_stats',
    label: 'Game stats',
    url: `/design-system/preview/game?id=${encodeURIComponent(DEFAULT_GAME_PREVIEW_ID)}`,
  },
  {
    name: 'session_ended',
    label: 'Session end',
    url: '/design-system/preview/playing?state=session_ended',
  },
  {
    name: 'session_inactivity',
    label: 'Inactive',
    url: '/design-system/preview/playing?state=session_ended_inactivity',
  },
  {
    name: 'no_session',
    label: 'No session',
    url: '/design-system/preview/playing?state=no_session',
  },
]

export function PlayerMobileHub() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [flow, setFlow] = useState<FlowTab>('player')

  useEffect(() => {
    const q = searchParams.get('flow')
    setFlow(q === 'staff' ? 'staff' : 'player')
  }, [searchParams])

  const selectFlow = useCallback(
    (next: FlowTab) => {
      setFlow(next)
      router.replace(`/design-system/screens/player-mobile?flow=${next}`, { scroll: false })
    },
    [router]
  )

  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Staff &amp; player control</h1>
        <p>
          Staff <code>/control</code> and player <code>/setup</code> · <code>/playing</code> — previews use real
          components (no Supabase writes).
        </p>
      </header>

      <div
        className="ds-state-switcher ds-scope-tabs"
        role="tablist"
        aria-label="Choose staff or player control flows"
      >
        <button
          type="button"
          role="tab"
          aria-selected={flow === 'staff'}
          className={`ds-state-btn ${flow === 'staff' ? 'ds-state-btn--active' : ''}`}
          onClick={() => selectFlow('staff')}
        >
          Staff control
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={flow === 'player'}
          className={`ds-state-btn ${flow === 'player' ? 'ds-state-btn--active' : ''}`}
          onClick={() => selectFlow('player')}
        >
          Player control
        </button>
      </div>

      {flow === 'staff' && (
        <section className="ds-section" id="staff-control">
          <h2>Staff — control panel</h2>
          <ScreenPreview
            title="Staff flow"
            description="Loading → setup → preview (match confirmation) → live scoreboard → end game. Best-of-3 finishes and end-match modal at the end."
            viewport="mobile"
            states={STAFF_MATCH_FLOW_TABS}
          />

          <h3 style={{ marginTop: 'var(--ui-space-xl)' }}>Opportunities for unification</h3>
          <ul className="ds-component-list">
            <li>
              Collapse duplicated layout between <code>MatchSetupForm</code> on control vs setup previews; one source
              for section spacing and sticky footers.
            </li>
            <li>
              Share modal and danger-button patterns with matchplay staff flows (<code>.btn</code> variants already
              overlap — extend token use for focus rings and sheet headers).
            </li>
            <li>
              Align “LIVE / FINAL” typography with spectator and court status rows for a single venue-staff visual
              language.
            </li>
          </ul>
        </section>
      )}

      {flow === 'player' && (
        <section className="ds-section" id="player-control">
          <h2>Player — setup &amp; playing</h2>
          <ScreenPreview
            title="Player flow"
            description="Checking → court in use (if needed) → setup → ready → live → end → summary → stats. Edge states (session end, inactive, no session) at the end."
            viewport="mobile"
            states={PLAYER_MATCH_FLOW_TABS}
          />

          <h3 style={{ marginTop: 'var(--ui-space-xl)' }}>Opportunities for unification</h3>
          <ul className="ds-component-list">
            <li>
              Gate screens use <code>SessionProtectionPrompt</code> — preview via the <strong>Court in use</strong>{' '}
              tab (active session takeover). Match-in-progress takeover uses the same card with different copy in
              production.
            </li>
            <li>
              <code>MatchFinishedPanel</code> and post-game CTAs should mirror staff endgame copy and button order to
              reduce training overhead for staff who also demo on player phones.
            </li>
            <li>
              Session review cards could reuse list-row styles from matchplay player entry for visual consistency
              across “social” flows.
            </li>
          </ul>
        </section>
      )}
    </div>
  )
}
