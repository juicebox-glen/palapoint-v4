import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

export default function MatchplayScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Social Matchplay</h1>
        <p>
          Venue social sessions (Americano today): launcher → format → players → event hub for rounds &amp; scoring →
          optional TV board. Production routes live under <code>/matchplay</code> (see table below).
        </p>
      </header>

      <section className="ds-section">
        <h2>Production routes</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Route</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Launcher</td>
              <td>
                <code>/matchplay</code>
              </td>
              <td>PIN gate, then format cards or continue active event</td>
            </tr>
            <tr>
              <td>Format setup</td>
              <td>
                <code>/matchplay/new</code>
              </td>
              <td>Courts, points per match, rounds</td>
            </tr>
            <tr>
              <td>Player entry</td>
              <td>
                <code>/matchplay/new/players</code>
              </td>
              <td>Add names, start event (creates DB event)</td>
            </tr>
            <tr>
              <td>Rounds, scoring, standings modal</td>
              <td>
                <code>/matchplay/[id]</code>
              </td>
              <td>Round tabs, match cards, score entry, standings modal</td>
            </tr>
            <tr>
              <td>TV board</td>
              <td>
                <code>/matchplay/[id]/board</code>
              </td>
              <td>Leaderboard + round fixtures + activity feed</td>
            </tr>
          </tbody>
        </table>
      </section>

      <ScreenPreview
        title="Launcher"
        description="Entry after PIN — format cards (Americano active). Matches /matchplay home when authenticated."
        viewport="tablet"
        states={[{ name: 'launcher', label: 'Launcher', url: '/design-system/preview/matchplay?state=launcher' }]}
      />

      <ScreenPreview
        title="Format setup"
        description="Courts, points per match, rounds — same UI as /matchplay/new."
        viewport="tablet"
        states={[{ name: 'setup', label: 'Format', url: '/design-system/preview/matchplay?state=setup' }]}
      />

      <ScreenPreview
        title="Player entry"
        description="Add players before START EVENT — same UI as /matchplay/new/players."
        viewport="tablet"
        states={[{ name: 'players', label: 'Players', url: '/design-system/preview/matchplay?state=players' }]}
      />

      <ScreenPreview
        title="Fixtures / rounds"
        description="Round tabs and setup match cards — same patterns as /matchplay/[id] during setup."
        viewport="tablet"
        states={[{ name: 'fixtures', label: 'Rounds', url: '/design-system/preview/matchplay?state=fixtures' }]}
      />

      <ScreenPreview
        title="Score entry"
        description="Expanded score card with steppers and confirm — same patterns as live /matchplay/[id]."
        viewport="tablet"
        states={[{ name: 'scoring', label: 'Scoring', url: '/design-system/preview/matchplay?state=scoring' }]}
      />

      <ScreenPreview
        title="Standings (tablet)"
        description="Standings modal on the event page — same table classes as /matchplay/[id]."
        viewport="tablet"
        states={[{ name: 'standings', label: 'Standings', url: '/design-system/preview/matchplay?state=standings' }]}
      />

      <ScreenPreview
        title="TV board — live"
        description="Leaderboard + round fixtures + ticker — same layout as /matchplay/[id]/board in progress."
        viewport="tv"
        states={[{ name: 'board', label: 'Live board', url: '/design-system/preview/matchplay?state=standings_tv' }]}
      />

      <ScreenDesignTokens
        typography={[
          { token: 'var(--font-family)', usage: 'Matchplay launcher, format, players, and event hub (Inter).' },
          { token: 'clamp() in matchplay-board.css', usage: 'TV board typography scaling.' },
        ]}
        colors={[
          { token: '--text-primary, --text-secondary', usage: 'Headers and body on matchplay flows.' },
          { token: '--brand-primary / matchplay pills', usage: 'Active format card, primary CTAs.' },
        ]}
        stylesheets={['app/styles/matchplay.css', 'app/styles/matchplay-board.css', 'app/styles/setup-form.css']}
        note="Previews are static markup with production class names; no Supabase. Query /design-system/preview/matchplay?state= for each iframe URL."
      />

      <section className="ds-section">
        <h2>States (event hub)</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Trigger</th>
              <th>Key elements</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Setup</td>
              <td>Event not started</td>
              <td>Round tabs, match cards with EDIT, resting list</td>
            </tr>
            <tr>
              <td>Live</td>
              <td>Event in progress</td>
              <td>Score steppers, confirm, pending cards</td>
            </tr>
            <tr>
              <td>Standings</td>
              <td>Toolbar / menu</td>
              <td>
                Modal with <code>matchplay-standings</code> table (Americano columns)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Formats</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Format</th>
              <th>Description</th>
              <th>Pairing logic</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Americano</td>
              <td>Random rotating partners</td>
              <td>Each round pairs players so everyone partners across the session</td>
            </tr>
            <tr>
              <td>Mexicano</td>
              <td>Skill-based pairing</td>
              <td>Planned — launcher shows coming soon</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Components used</h2>
        <ul className="ds-component-list">
          <li>Format cards (launcher)</li>
          <li>Format pills &amp; summary (format setup)</li>
          <li>Player list rows (player entry)</li>
          <li>Round tabs &amp; match cards (event page)</li>
          <li>Score steppers &amp; confirm (event page)</li>
          <li>Standings table (modal + TV board)</li>
          <li>Board fixture list &amp; activity feed (TV)</li>
        </ul>
      </section>
    </div>
  )
}
