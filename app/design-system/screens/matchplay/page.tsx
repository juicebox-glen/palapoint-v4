import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

const MATCHPLAY_PREVIEW_BASE = '/design-system/preview/matchplay'

const STAFF_STATES: ScreenPreviewState[] = [
  { name: 'launcher', label: 'Launcher', url: `${MATCHPLAY_PREVIEW_BASE}?state=launcher` },
  { name: 'format', label: 'Format Setup', url: `${MATCHPLAY_PREVIEW_BASE}?state=format` },
  { name: 'players', label: 'Player Entry', url: `${MATCHPLAY_PREVIEW_BASE}?state=players` },
  { name: 'event', label: 'Event Hub', url: `${MATCHPLAY_PREVIEW_BASE}?state=event` },
]

const TV_BOARD_STATES: ScreenPreviewState[] = [
  { name: 'board_setup', label: 'Starting Soon', url: `${MATCHPLAY_PREVIEW_BASE}?state=board_setup` },
  { name: 'board_live', label: 'Live', url: `${MATCHPLAY_PREVIEW_BASE}?state=board_live` },
  { name: 'board_completed', label: 'Completed', url: `${MATCHPLAY_PREVIEW_BASE}?state=board_completed` },
]

export default function MatchplayScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Social Matchplay</h1>
        <p>
          Tournament-style social sessions with automatic fixture generation (Americano today). Staff flows run on
          tablet; the TV board is a dedicated venue display at <code>/matchplay/[id]/board</code>, separate from the
          court spectator at <code>/live/…</code>.
        </p>
      </header>

      <section className="ds-section">
        <h2>Staff Screens (Tablet)</h2>
        <ScreenPreview
          title="Staff Matchplay Management"
          description="Setup and manage social events — static markup with production CSS classes."
          viewport="tablet"
          states={STAFF_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>TV Board (Spectator)</h2>
        <ScreenPreview
          title="Matchplay TV Board"
          description="Leaderboard, round fixtures, and activity feed for venue TVs — same classes as /matchplay/[id]/board."
          viewport="tv"
          states={TV_BOARD_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>Staff Flow</h2>
        <div className="ds-flow-diagram">
          <div className="ds-flow-step">
            <span className="ds-flow-number">1</span>
            <span className="ds-flow-label">Launcher</span>
            <span className="ds-flow-desc">Select format</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">2</span>
            <span className="ds-flow-label">Setup</span>
            <span className="ds-flow-desc">Courts, rounds</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">3</span>
            <span className="ds-flow-label">Players</span>
            <span className="ds-flow-desc">Add names</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">4</span>
            <span className="ds-flow-label">Event</span>
            <span className="ds-flow-desc">Score matches</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">5</span>
            <span className="ds-flow-label">Complete</span>
            <span className="ds-flow-desc">Final standings</span>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>TV Board States</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Trigger</th>
              <th>Display</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Starting Soon</td>
              <td>Event created, status: setup</td>
              <td>Brand, event name, date, pulsing badge, player grid</td>
            </tr>
            <tr>
              <td>Live</td>
              <td>Event started, status: in_progress</td>
              <td>LIVE badge, leaderboard table, current round fixtures, activity feed, footer scoring summary</td>
            </tr>
            <tr>
              <td>Completed</td>
              <td>Event ended, status: completed</td>
              <td>FINAL badge, winner card, podium (top 3), final standings table, footer</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Standings Columns (board / staff modal)</h2>
        <p style={{ marginBottom: 'var(--ui-space-md)', color: 'var(--text-secondary)' }}>
          Staff event hub uses Americano-specific columns in the standings modal; the TV board uses played / W / D / L
          / GD / Pts. Preview tables mirror those layouts.
        </p>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Column</th>
              <th>Meaning</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>#</td>
              <td>Rank</td>
            </tr>
            <tr>
              <td>Player</td>
              <td>Name</td>
            </tr>
            <tr>
              <td>P</td>
              <td>Matches played (board) — or W/T/L/P/+/− for Americano staff modal</td>
            </tr>
            <tr>
              <td>W / D / L</td>
              <td>Matches won, drawn, lost</td>
            </tr>
            <tr>
              <td>GD</td>
              <td>Game / point differential</td>
            </tr>
            <tr>
              <td>Pts</td>
              <td>League / total points (primary ranking on board)</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>URL Structure</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Purpose</th>
              <th>Audience</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <code>/matchplay</code>
              </td>
              <td>Launcher + event list</td>
              <td>Staff (PIN gated)</td>
            </tr>
            <tr>
              <td>
                <code>/matchplay/new</code>
              </td>
              <td>Format setup</td>
              <td>Staff</td>
            </tr>
            <tr>
              <td>
                <code>/matchplay/new/players</code>
              </td>
              <td>Player entry</td>
              <td>Staff</td>
            </tr>
            <tr>
              <td>
                <code>/matchplay/[id]</code>
              </td>
              <td>Event management</td>
              <td>Staff</td>
            </tr>
            <tr>
              <td>
                <code>/matchplay/[id]/board</code>
              </td>
              <td>TV spectator view</td>
              <td>Venue TVs</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Court spectator (separate product)</h2>
        <p>
          Match-by-match venue TV for a court session lives at <code>/live/[courtSlug]</code>. Previews:{' '}
          <Link href="/design-system/screens/spectator">Spectator Display (TV)</Link> and{' '}
          <code>/design-system/preview/spectator?state=…</code>.
        </p>
      </section>

      <ScreenDesignTokens
        typography={[
          { token: 'var(--font-family)', usage: 'Staff matchplay flows (Inter).' },
          { token: 'clamp() in matchplay-board.css', usage: 'TV board typography scales with viewport height.' },
        ]}
        colors={[
          { token: '--bg-*, --text-*', usage: 'Staff surfaces and type hierarchy.' },
          { token: '--brand-primary', usage: 'Active pills, primary CTAs, live accents.' },
          { token: '--success / --warning', usage: 'Status badges, LIVE / STARTING SOON, completed borders.' },
        ]}
        stylesheets={['app/styles/matchplay.css', 'app/styles/matchplay-board.css', 'app/styles/setup-form.css']}
        note="Previews: /design-system/preview/matchplay?state=launcher|format|players|event|board_setup|board_live|board_completed. Legacy ?state=setup|fixtures|scoring|standings|standings_tv still resolve."
      />

      <section className="ds-section">
        <h2>Notes</h2>
        <div className="ds-note-block">
          <p>
            <strong>Separate from Court Spectator:</strong> The matchplay board (<code>/matchplay/[id]/board</code>) is
            a different product surface from the court spectator (<code>/live/[court]</code>). They show different data
            and layouts.
          </p>
          <p>
            <strong>Realtime:</strong> Production staff event page and TV board subscribe to Supabase realtime for
            standings, matches, rounds, and event status. These previews are static.
          </p>
          <p>
            <strong>Future:</strong> Company/venue URL routing (<code>/matchplay/[company]/[venue]</code>) is planned but
            not yet implemented.
          </p>
        </div>
      </section>
    </div>
  )
}
