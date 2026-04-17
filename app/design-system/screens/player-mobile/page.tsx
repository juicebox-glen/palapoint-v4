import Link from 'next/link'

import { ScreenPreview } from '../../components/ScreenPreview'

export default function PlayerMobileScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Player mobile — Setup &amp; playing</h1>
        <p>
          Production routes: <code>/setup/[courtSlug]</code> (single slug or <code>company/venue/court</code>) and{' '}
          <code>/playing/[courtSlug]</code>. Previews below use real <code>SetupDisplay</code> and{' '}
          <code>PlayingDisplay</code> with design-system flags (no Supabase writes).
        </p>
      </header>

      <section className="ds-section" id="end-to-end">
        <h2>End-to-end flow</h2>
        <div className="ds-flow-diagram">
          <div className="ds-flow-step">
            <span className="ds-flow-number">1</span>
            <span className="ds-flow-label">Open /setup</span>
            <span className="ds-flow-desc">QR or link → session + match checks</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">2</span>
            <span className="ds-flow-label">Gates</span>
            <span className="ds-flow-desc">Active match or session prompts</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">3</span>
            <span className="ds-flow-label">Match setup form</span>
            <span className="ds-flow-desc">Names, photos, mode → START GAME</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">4</span>
            <span className="ds-flow-label">/playing</span>
            <span className="ds-flow-desc">Ready → live → post-game</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">5</span>
            <span className="ds-flow-label">After match</span>
            <span className="ds-flow-desc">Rematch, edit, end session → review</span>
          </div>
        </div>
      </section>

      <section className="ds-section" id="setup-route">
        <h2>/setup — Player setup</h2>
        <p>
          Implemented by <code>SetupDisplay</code>: resolves a <strong>session</strong> (create, stored id, or takeover),
          then either shows <strong>SessionProtectionPrompt</strong> variants or <strong>MatchSetupForm</strong> (four
          players, optional photos, game options). Scoring does not happen here — it happens on the court / control.
        </p>

        <ScreenPreview
          title="SetupDisplay"
          description="Production components in preview mode (no Supabase session/match calls; START GAME is a no-op)."
          viewport="mobile"
          states={[
            { name: 'form', label: 'Match setup form', url: '/design-system/preview/setup?state=form' },
            { name: 'review', label: 'Names filled', url: '/design-system/preview/setup?state=review' },
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
                <code>MatchSetupForm</code> — players, photos, mode, START GAME creates <code>live_matches</code> and
                navigates to <code>/playing</code>
              </td>
            </tr>
            <tr>
              <td>Match in progress</td>
              <td>
                Active <code>live_matches</code> row (<code>setup</code> or <code>in_progress</code>)
              </td>
              <td>
                Take Over stores session id and opens <code>/playing</code>; Cancel goes back
              </td>
            </tr>
            <tr>
              <td>Court in use</td>
              <td>Another active session on the court, no join path</td>
              <td>
                Take Over calls <code>takeoverSession</code> (ends prior session/matches) then new setup
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section" id="playing-route">
        <h2>/playing — Companion during &amp; after the match</h2>
        <p>
          Implemented by <code>PlayingDisplay</code>: requires <code>sessionStorage</code> session id (set from setup).
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
            { name: 'postgame_win', label: 'Post-game (winner)', url: '/design-system/preview/playing?state=postgame_win' },
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
              <td>Message + Start New Session → <code>/setup</code></td>
            </tr>
            <tr>
              <td>Pre-game (ready)</td>
              <td>
                Match <code>in_progress</code>, score still 0–0 points and 0–0 games
              </td>
              <td>
                READY header, matchup card, “Press a button on court to begin”, End Game
              </td>
            </tr>
            <tr>
              <td>In game</td>
              <td>Match in progress, play has started</td>
              <td>LIVE header, matchup card, “Use the court buttons to score”, End Game</td>
            </tr>
            <tr>
              <td>Post-game</td>
              <td>Match completed, abandoned, or has a winner</td>
              <td>Final score, Rematch, Edit Match → setup, End Session → session review</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Notes</h2>
        <div className="ds-note-block">
          <p>
            <strong>Staff / TV:</strong> The same <code>live_matches</code> row is edited from <code>/control</code>{' '}
            and shown on <code>/court</code>; player phones only mirror state.
          </p>
          <p>
            <strong>Previews:</strong> <code>/design-system/preview/setup</code> and{' '}
            <code>/design-system/preview/playing</code> — query <code>?state=</code> as in the previews above.
          </p>
        </div>
      </section>
    </div>
  )
}
