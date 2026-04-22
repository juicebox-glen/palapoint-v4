'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

type FlowTab = 'staff' | 'player'

const STAFF_MATCH_FLOW_TABS: ScreenPreviewState[] = [
  { name: 'setup', label: 'Setup', url: '/design-system/preview/control?state=setup' },
  { name: 'preview', label: 'Preview', url: '/design-system/preview/control?state=preview' },
  { name: 'live', label: 'Live', url: '/design-system/preview/control?state=live' },
  { name: 'endgame', label: 'End game', url: '/design-system/preview/control?state=endgame' },
]

const PLAYER_MATCH_FLOW_TABS: ScreenPreviewState[] = [
  { name: 'setup', label: 'Setup', url: '/design-system/preview/setup?state=form' },
  { name: 'preview', label: 'Preview', url: '/design-system/preview/setup?state=confirmation' },
  { name: 'live', label: 'Live', url: '/design-system/preview/playing?state=live' },
  { name: 'endgame', label: 'End', url: '/design-system/preview/playing?state=postgame_win' },
  {
    name: 'end_multi',
    label: 'End Multi',
    url: '/design-system/preview/playing?state=postgame_win_3split',
  },
  {
    name: 'session_review',
    label: 'Session',
    url: '/design-system/preview/session-review',
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
            description="Setup → preview (match confirmation) → live scoreboard → end game."
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
            description="Setup → confirmation → live → finished (1 set and best-of-3) → session summary."
            viewport="mobile"
            states={PLAYER_MATCH_FLOW_TABS}
          />

          <h3 style={{ marginTop: 'var(--ui-space-xl)' }}>Opportunities for unification</h3>
          <ul className="ds-component-list">
            <li>
              Gate screens (<code>no_session</code>, <code>session_ended</code>, etc.) could share one “empty state”
              component with staff PIN / venue errors for faster iteration.
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
