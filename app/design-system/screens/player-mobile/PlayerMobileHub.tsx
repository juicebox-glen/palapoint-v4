'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

type FlowTab = 'staff' | 'player'

/** Staff: four tabs. Player: same flow plus session summary after End session. */
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
          Production routes: <code>/control/[courtSlug]</code> (staff), <code>/setup/[courtSlug]</code>,{' '}
          <code>/playing/[courtSlug]</code>, and <code>/session-review/[sessionId]</code> (player companion). Previews use
          real components in design-system preview mode (no Supabase writes).
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
        <>
          <section className="ds-section" id="staff-control">
            <h2>/control — Staff control panel</h2>
            <p>
              Mobile/tablet UI to create or update a match, confirm on the preview screen, start scoring live, and
              handle endgame. Uses <code>ControlPanel</code> with <code>MatchSetupForm</code> and{' '}
              <code>MatchConfirmation</code> (preview step).
            </p>

            <ScreenPreview
              title="Staff flow"
              description="Same stages as player: ControlPanel for setup → preview (MatchConfirmation) → live → end game."
              viewport="mobile"
              states={STAFF_MATCH_FLOW_TABS}
            />

            <ScreenDesignTokens
              typography={[
                {
                  token: "var(--font-family) ('Inter', …)",
                  usage: 'All control UI: headers, scoreboard, buttons, modals (`control-panel.css`).',
                },
                {
                  token: '0.8125rem – 1rem typical',
                  usage: 'Live header, game mode label, score names; thumb-sized buttons scale with padding.',
                },
              ]}
              colors={[
                { token: '--bg-primary', usage: 'Full panel background.' },
                { token: '--bg-secondary, --bg-tertiary', usage: 'Scoreboard card gradient, dots, chrome.' },
                { token: '--text-primary, --text-secondary', usage: 'LIVE line, game mode, names.' },
                { token: '--team-a, --team-b (+ -glow)', usage: 'Serve bars, score buttons, live pulse dot.' },
                { token: '--error', usage: 'Errors, END MATCH, danger modal actions.' },
                { token: '--border-default', usage: 'Dividers and modal edges where used.' },
              ]}
              stylesheets={[
                'app/styles/control-panel.css',
                'app/styles/setup-form.css',
                'app/styles/components/buttons.css',
                'app/styles/tokens/colors.css',
                'app/styles/tokens/typography.css',
              ]}
              note="Setup and preview reuse `MatchSetupForm` / shared `.btn` styles. Preview iframe loads `/design-system/preview/control?state=…` (real components, network disabled)."
            />

            <h3>Stages (tabs)</h3>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Stage</th>
                  <th>Preview</th>
                  <th>What it is</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Setup</td>
                  <td>
                    <code>/preview/control?state=setup</code>
                  </td>
                  <td>Game mode, sets, toggles, players, photos — Continue saves row</td>
                </tr>
                <tr>
                  <td>Preview</td>
                  <td>
                    <code>/preview/control?state=preview</code>
                  </td>
                  <td>READY, matchup, badges (<code>MatchConfirmation</code>) — Start match</td>
                </tr>
                <tr>
                  <td>Live</td>
                  <td>
                    <code>/preview/control?state=live</code>
                  </td>
                  <td>LIVE scoreboard, points, Undo, End match</td>
                </tr>
                <tr>
                  <td>End game</td>
                  <td>
                    <code>/preview/control?state=endgame</code>
                  </td>
                  <td>FINAL, winner, Rematch / Edit match</td>
                </tr>
              </tbody>
            </table>

            <h3>Additional previews</h3>
            <p className="ds-token-intro">
              Venue displays:{' '}
              <Link href="/design-system/preview/court">/design-system/preview/court</Link> ·{' '}
              <Link href="/design-system/preview/spectator">/design-system/preview/spectator</Link> (
              <code>idle</code>, <code>pregame</code>, <code>live</code>, <code>endgame</code>).
            </p>

            <h3>Form elements</h3>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>Element</th>
                  <th>Type</th>
                  <th>Options</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Game mode</td>
                  <td>Button group</td>
                  <td>Traditional, Golden, Silver</td>
                </tr>
                <tr>
                  <td>Sets</td>
                  <td>Button group</td>
                  <td>1 set, 3 sets</td>
                </tr>
                <tr>
                  <td>Tiebreak</td>
                  <td>Toggle</td>
                  <td>On / off</td>
                </tr>
                <tr>
                  <td>Side swap</td>
                  <td>Toggle</td>
                  <td>On / off</td>
                </tr>
                <tr>
                  <td>Player name</td>
                  <td>Text input</td>
                  <td>Free text</td>
                </tr>
                <tr>
                  <td>Player photo</td>
                  <td>Photo capture</td>
                  <td>Camera / upload (sheet)</td>
                </tr>
              </tbody>
            </table>

            <h3>Components used</h3>
            <ul className="ds-component-list">
              <li>
                <Link href="/design-system/components/headers">SetupScreenHeader (centered logo)</Link>
              </li>
              <li>
                <Link href="/design-system/components/buttons">Shared `.btn` (Continue, preview, endgame)</Link>
              </li>
              <li>
                <Link href="/design-system/components/buttons">Control score buttons (`.control-score-button`)</Link>
              </li>
              <li>
                <Link href="/design-system/components/badges">Status dots / LIVE label</Link>
              </li>
              <li>
                <Link href="/design-system/components/photos">Player photo capture</Link>
              </li>
              <li>
                <Link href="/design-system/components/cards">Match confirmation (<code>MatchConfirmation</code>)</Link>
              </li>
              <li>MatchSetupForm (mode cards, toggles, inputs)</li>
              <li>Finished layout (<code>MatchFinishedPanel</code> — same as player /playing)</li>
            </ul>
          </section>
        </>
      )}

      {flow === 'player' && (
        <section className="ds-section" id="player-control">
          <h2>/setup + /playing — Player control</h2>
          <p>
            Same tab names as staff: <code>SetupDisplay</code> for <strong>Setup</strong> and{' '}
            <strong>Preview</strong> (<code>MatchConfirmation</code>), then <code>PlayingDisplay</code> for{' '}
            <strong>Live</strong> and <strong>End game</strong>. Session / match gate screens are under{' '}
            <em>Additional preview states</em> below.
          </p>

          <ScreenPreview
            title="Player flow"
            description="Phone previews: setup → confirmation → live → finished (1 set) → finished best-of-3 (three set rows) → session summary with three sample games."
            viewport="mobile"
            states={PLAYER_MATCH_FLOW_TABS}
          />

          <h3>Stages (tabs)</h3>
          <table className="ds-table">
            <thead>
              <tr>
                <th>Stage</th>
                <th>Preview</th>
                <th>Production</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Setup</td>
                <td>
                  <code>/preview/setup?state=form</code>
                </td>
                <td>
                  <code>MatchSetupForm</code> on <code>/setup</code> — Continue creates <code>setup</code> row
                </td>
              </tr>
              <tr>
                <td>Preview</td>
                <td>
                  <code>/preview/setup?state=confirmation</code>
                </td>
                <td>
                  <code>MatchConfirmation</code> — court CTA + Edit match; then <code>in_progress</code> →{' '}
                  <code>/playing</code>
                </td>
              </tr>
              <tr>
                <td>Live</td>
                <td>
                  <code>/preview/playing?state=live</code>
                </td>
                <td>
                  <code>PlayingDisplay</code> — read-only scoring copy; End game
                </td>
              </tr>
              <tr>
                <td>End</td>
                <td>
                  <code>/preview/playing?state=postgame_win</code>
                </td>
                <td>
                  <code>MatchFinishedPanel</code> — single-set score; Rematch, Edit match, End session
                </td>
              </tr>
              <tr>
                <td>End Multi</td>
                <td>
                  <code>/preview/playing?state=postgame_win_3split</code>
                </td>
                <td>Same panel — best-of-3 decider (three set rows). Extra: <code>postgame_win_3sweep</code> (2–0)</td>
              </tr>
              <tr>
                <td>Session complete</td>
                <td>
                  <code>/preview/session-review</code>
                </td>
                <td>
                  <code>SessionReviewDisplay</code> after <strong>End session</strong> →{' '}
                  <code>/session-review/[sessionId]</code>
                </td>
              </tr>
            </tbody>
          </table>

          <h3>Additional preview states</h3>
          <p className="ds-token-intro" style={{ marginBottom: '0.75rem' }}>
            Gates and edge cases (URL variants not in the primary tab strip, or staff-only):
          </p>
          <ul className="ds-component-list">
            <li>
              <strong>Setup:</strong>{' '}
              <code>?state=review</code> (filled form), <code>match_join</code>, <code>session_prompt</code>
            </li>
            <li>
              <strong>Playing:</strong>{' '}
              <code>no_session</code>, <code>session_ended</code>, <code>session_ended_inactivity</code>,{' '}
              <code>ready</code>, <code>postgame_abandoned</code>
            </li>
            <li>
              <strong>Court / spectator:</strong>{' '}
              <Link href="/design-system/preview/court">/preview/court</Link>,{' '}
              <Link href="/design-system/preview/spectator">/preview/spectator</Link>
            </li>
          </ul>
        </section>
      )}

      <section className="ds-section">
        <h2>Preview URLs</h2>
        <div className="ds-note-block">
          <p>
            <strong>Shared hub tabs (staff &amp; player):</strong> staff:{' '}
            <code>/preview/control?state=setup|preview|live|endgame</code> · player:{' '}
            <code>/preview/setup?state=form|confirmation</code>, <code>/preview/playing?state=live|postgame_win|postgame_win_3split</code>,{' '}
            <code>/preview/session-review</code>
          </p>
          <p>
            <strong>Staff only:</strong> <code>/preview/control?state=</code>
            <code>setup</code> | <code>preview</code> | <code>live</code> | <code>endgame</code>
          </p>
          <p>
            <strong>Player setup (extra):</strong> <code>/preview/setup?state=</code>
            <code>review</code> | <code>match_join</code> | <code>session_prompt</code>
          </p>
          <p>
            <strong>Player playing (extra):</strong> <code>/preview/playing?state=</code>
            <code>no_session</code> | <code>session_ended</code> | <code>session_ended_inactivity</code> |{' '}
            <code>ready</code> | <code>postgame_abandoned</code> | <code>postgame_win_3sweep</code>
          </p>
          <p>
            <strong>Player session review:</strong> <code>/preview/session-review</code> (after End session)
          </p>
          <p>
            <strong>Spectator:</strong> <code>/preview/spectator?state=</code>
            <code>idle</code> | <code>pregame</code> | <code>live</code> | <code>endgame</code>
          </p>
          <p>
            The same <code>live_matches</code> row is edited from <code>/control</code>, shown on <code>/court</code>{' '}
            and <code>/live</code>; player phones mirror state on <code>/setup</code> and <code>/playing</code>.
          </p>
        </div>
      </section>
    </div>
  )
}
