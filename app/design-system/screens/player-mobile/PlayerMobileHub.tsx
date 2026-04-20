'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

type FlowTab = 'staff' | 'player'

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
          Production routes: <code>/control/[courtSlug]</code> (staff), <code>/setup/[courtSlug]</code> and{' '}
          <code>/playing/[courtSlug]</code> (player companion). Previews use real components in design-system preview
          mode (no Supabase writes).
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
              title="ControlPanel"
              description="Real ControlPanel in preview mode: setup → preview (MatchConfirmation) → live → endgame."
              viewport="mobile"
              states={[
                { name: 'setup', label: 'Setup', url: '/design-system/preview/control?state=setup' },
                { name: 'preview', label: 'Preview', url: '/design-system/preview/control?state=preview' },
                { name: 'live', label: 'Live', url: '/design-system/preview/control?state=live' },
                { name: 'endgame', label: 'End game', url: '/design-system/preview/control?state=endgame' },
              ]}
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

            <h3>States</h3>
            <table className="ds-table">
              <thead>
                <tr>
                  <th>State</th>
                  <th>Trigger</th>
                  <th>Key elements</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Setup</td>
                  <td>Initial load / after ending match</td>
                  <td>Game mode buttons, sets selector, toggles, player inputs with photo capture</td>
                  <td>Continue</td>
                </tr>
                <tr>
                  <td>Preview</td>
                  <td>After Continue (creates or updates <code>live_matches</code> in <code>setup</code>)</td>
                  <td>READY badge, team cards, mode badges (<code>MatchConfirmation</code>)</td>
                  <td>Edit match, Start match</td>
                </tr>
                <tr>
                  <td>Live</td>
                  <td>After Start match</td>
                  <td>LIVE badge, score display, serving indicator, point situation when applicable</td>
                  <td>Team A / B point, Undo, End match</td>
                </tr>
                <tr>
                  <td>End game</td>
                  <td>Match completed (winner determined)</td>
                  <td>FINAL badge, winner highlight, final score</td>
                  <td>Edit match, Rematch</td>
                </tr>
              </tbody>
            </table>

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
              <li>Endgame layout (`.control-endgame`)</li>
            </ul>
          </section>
        </>
      )}

      {flow === 'player' && (
        <>
          <section className="ds-section" id="setup-route">
            <h2>/setup — Player setup</h2>
            <p>
              Implemented by <code>SetupDisplay</code>: resolves a <strong>session</strong> (create, stored id, or
              takeover), then either <strong>SessionProtectionPrompt</strong> variants, <strong>MatchSetupForm</strong>,
              or the shared <strong>MatchConfirmation</strong> pre-game screen after the match row exists. Scoring stays
              on the court / staff control — not on the phone.
            </p>

            <ScreenPreview
              title="SetupDisplay"
              description="Production components in preview mode (no Supabase session/match API; form submit is a no-op in preview)."
              viewport="mobile"
              states={[
                { name: 'form', label: 'Match setup form', url: '/design-system/preview/setup?state=form' },
                { name: 'review', label: 'Form (names filled)', url: '/design-system/preview/setup?state=review' },
                {
                  name: 'confirmation',
                  label: 'Pre-game confirmation',
                  url: '/design-system/preview/setup?state=confirmation',
                },
                {
                  name: 'match_join',
                  label: 'Match in progress',
                  url: '/design-system/preview/setup?state=match_join',
                },
                {
                  name: 'session_prompt',
                  label: 'Court in use (session)',
                  url: '/design-system/preview/setup?state=session_prompt',
                },
              ]}
            />

            <table className="ds-table" style={{ marginTop: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Screen</th>
                  <th>When</th>
                  <th>What happens</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Match setup form</td>
                  <td>No blocking match / session conflict</td>
                  <td>
                    <code>MatchSetupForm</code> — players, photos, mode. <strong>Continue</strong> creates{' '}
                    <code>live_matches</code> in <code>setup</code> (with <code>session_id</code>); stays on{' '}
                    <code>/setup</code> and shows confirmation (production).
                  </td>
                </tr>
                <tr>
                  <td>Pre-game confirmation</td>
                  <td>After Continue with a saved setup row</td>
                  <td>
                    Same layout as staff preview: READY, matchup, badges. Prominent status banner: press button on
                    court to start (not tappable). <strong>Edit match</strong> is a small ghost button below — returns
                    to the form (<code>update_setup</code> on next continue). When the match becomes{' '}
                    <code>in_progress</code>, navigate to <code>/playing</code>.
                  </td>
                </tr>
                <tr>
                  <td>Match in progress</td>
                  <td>
                    Active <code>live_matches</code> row (<code>setup</code> or <code>in_progress</code>)
                  </td>
                  <td>
                    Take over stores session id and opens <code>/playing</code>; Cancel goes back
                  </td>
                </tr>
                <tr>
                  <td>Court in use</td>
                  <td>Another active session on the court, no join path</td>
                  <td>
                    Take over calls <code>takeoverSession</code> (ends prior session) then new setup
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="ds-section" id="playing-route">
            <h2>/playing — Companion during &amp; after the match</h2>
            <p>
              Implemented by <code>PlayingDisplay</code>: requires <code>sessionStorage</code> session id (from setup).
              Loads <code>live_matches</code> for the court with realtime updates. Phone is{' '}
              <strong>read-only for scoring</strong> — players use court hardware to score.
            </p>

            <ScreenPreview
              title="PlayingDisplay"
              description="Live UI; preview uses fixed mock match/session data."
              viewport="mobile"
              states={[
                { name: 'no_session', label: 'No session', url: '/design-system/preview/playing?state=no_session' },
                {
                  name: 'session_ended',
                  label: 'Session ended',
                  url: '/design-system/preview/playing?state=session_ended',
                },
                {
                  name: 'session_ended_inactivity',
                  label: 'Session timeout',
                  url: '/design-system/preview/playing?state=session_ended_inactivity',
                },
                { name: 'ready', label: 'Pre-game (ready)', url: '/design-system/preview/playing?state=ready' },
                { name: 'live', label: 'In game', url: '/design-system/preview/playing?state=live' },
                {
                  name: 'postgame_win',
                  label: 'Post-game (winner)',
                  url: '/design-system/preview/playing?state=postgame_win',
                },
                {
                  name: 'postgame_abandoned',
                  label: 'Post-game (abandoned)',
                  url: '/design-system/preview/playing?state=postgame_abandoned',
                },
              ]}
            />

            <table className="ds-table" style={{ marginTop: '1.5rem' }}>
              <thead>
                <tr>
                  <th>Phase</th>
                  <th>Condition</th>
                  <th>UI</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>No session</td>
                  <td>Missing session id in storage</td>
                  <td>Prompt to return to <code>/setup</code></td>
                </tr>
                <tr>
                  <td>Session ended</td>
                  <td>
                    <code>validateSession</code> fails (ended or inactivity)
                  </td>
                  <td>Message + Start new session → <code>/setup</code></td>
                </tr>
                <tr>
                  <td>Pre-game (ready)</td>
                  <td>
                    Match <code>in_progress</code>, score still 0–0 points and 0–0 games
                  </td>
                  <td>
                    READY header, matchup card, “Press a button on court to begin”, End game
                  </td>
                </tr>
                <tr>
                  <td>In game</td>
                  <td>Match in progress, play has started</td>
                  <td>LIVE header, matchup card, “Use the court buttons to score”, End game</td>
                </tr>
                <tr>
                  <td>Post-game</td>
                  <td>Match completed, abandoned, or has a winner</td>
                  <td>Final score, Rematch, Edit match → setup, End session → session review</td>
                </tr>
              </tbody>
            </table>
          </section>
        </>
      )}

      <section className="ds-section">
        <h2>Preview URLs</h2>
        <div className="ds-note-block">
          <p>
            <strong>Staff:</strong> <code>/design-system/preview/control?state=</code>
            <code>setup</code> | <code>preview</code> | <code>live</code> | <code>endgame</code>
          </p>
          <p>
            <strong>Player setup:</strong> <code>/design-system/preview/setup?state=</code>
            <code>form</code> | <code>review</code> | <code>confirmation</code> | <code>match_join</code> |{' '}
            <code>session_prompt</code>
          </p>
          <p>
            <strong>Player playing:</strong> <code>/design-system/preview/playing?state=</code>
            <code>no_session</code> | <code>session_ended</code> | <code>session_ended_inactivity</code> |{' '}
            <code>ready</code> | <code>live</code> | <code>postgame_win</code> | <code>postgame_abandoned</code>
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
