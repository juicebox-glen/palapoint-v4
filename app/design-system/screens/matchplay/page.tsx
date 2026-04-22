import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

const MATCHPLAY_PREVIEW_BASE = '/design-system/preview/matchplay'
const SPECTATOR_PREVIEW_BASE = '/design-system/preview/spectator'

/** Tablet / matchplay hub — static markup, same classes as production. */
const MATCHPLAY_SETUP_TABS: ScreenPreviewState[] = [
  { name: 'launcher', label: 'Launcher', url: `${MATCHPLAY_PREVIEW_BASE}?state=launcher` },
  { name: 'format', label: 'Format', url: `${MATCHPLAY_PREVIEW_BASE}?state=setup` },
  { name: 'players', label: 'Players', url: `${MATCHPLAY_PREVIEW_BASE}?state=players` },
  { name: 'fixtures', label: 'Rounds', url: `${MATCHPLAY_PREVIEW_BASE}?state=fixtures` },
  { name: 'scoring', label: 'Scoring', url: `${MATCHPLAY_PREVIEW_BASE}?state=scoring` },
  { name: 'standings', label: 'Standings', url: `${MATCHPLAY_PREVIEW_BASE}?state=standings` },
]

/** Venue TV — real spectator components (same as court match TV; 1920×1080). */
const MATCHPLAY_SPECTATOR_TABS: ScreenPreviewState[] = [
  { name: 'idle', label: 'Idle', url: `${SPECTATOR_PREVIEW_BASE}?state=idle` },
  { name: 'pregame', label: 'Pre-game', url: `${SPECTATOR_PREVIEW_BASE}?state=pregame` },
  { name: 'live', label: 'Live', url: `${SPECTATOR_PREVIEW_BASE}?state=live` },
  { name: 'endgame', label: 'End game', url: `${SPECTATOR_PREVIEW_BASE}?state=endgame` },
]

export default function MatchplayScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Match play</h1>
        <p>
          Social matchplay (Americano today): <strong>Setup</strong> is the tablet flow from PIN through the event hub
          (static previews). <strong>Spectator display</strong> is the venue TV experience for a match — same
          components as the general spectator screen, shown here for matchplay context. Production:{' '}
          <code>/matchplay</code> and related routes; TV board with fixtures/standings lives at{' '}
          <code>/matchplay/[id]/board</code> (separate static preview:{' '}
          <a href={`${MATCHPLAY_PREVIEW_BASE}?state=standings_tv`}>standings_tv</a>).
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
              <td>TV board (fixtures)</td>
              <td>
                <code>/matchplay/[id]/board</code>
              </td>
              <td>Leaderboard + round fixtures + activity feed (static preview: matchplay <code>?state=standings_tv</code>)</td>
            </tr>
            <tr>
              <td>Spectator TV (match)</td>
              <td>
                <code>/live/[courtSlug]</code>
              </td>
              <td>
                <code>SpectatorDisplay</code> — same UI as the Spectator display tabs below (venue lounge / bar TV)
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section" id="matchplay-setup">
        <h2>Setup</h2>
        <p>
          Launcher after PIN → format → players → event hub (rounds, live scoring, standings modal). Previews use{' '}
          <code>/design-system/preview/matchplay</code> with <code>?state=</code>.
        </p>
        <ScreenPreview
          title="Setup (preview)"
          description="Static HTML with production class names — no Supabase."
          viewport="tablet"
          states={MATCHPLAY_SETUP_TABS}
        />
      </section>

      <section className="ds-section" id="matchplay-spectator">
        <h2>Spectator display</h2>
        <p>
          TV-sized spectator flow: idle → pre-game → live → end game. Uses real <code>Spectator*</code> components; open{' '}
          <code>/design-system/preview/spectator?state=…</code> (same as the standalone{' '}
          <Link href="/design-system/screens/spectator">Spectator Display (TV)</Link> page).
        </p>
        <ScreenPreview
          title="Spectator display (preview)"
          description="1920×1080 viewport — same surfaces as venue match TV alongside matchplay."
          viewport="tv"
          states={MATCHPLAY_SPECTATOR_TABS}
        />
      </section>

      <ScreenDesignTokens
        typography={[
          { token: 'var(--font-family)', usage: 'Matchplay setup hub and spectator body text (Inter).' },
          { token: 'clamp() in matchplay-board.css', usage: 'Matchplay event board (fixtures TV) typography scaling.' },
          {
            token: "'Space Grotesk' + clamp / vh",
            usage: 'Spectator large names and TV-scale headers (`spectator.css`).',
          },
        ]}
        colors={[
          { token: '--text-primary, --text-secondary', usage: 'Matchplay setup flows and spectator labels.' },
          { token: '--brand-primary / matchplay pills', usage: 'Active format card, primary CTAs on setup.' },
          { token: '--team-a, --team-b', usage: 'Spectator team-tinted cards and accents.' },
        ]}
        stylesheets={[
          'app/styles/matchplay.css',
          'app/styles/matchplay-board.css',
          'app/styles/setup-form.css',
          'app/styles/spectator.css',
        ]}
        note="Setup: use the Setup tabs or /design-system/preview/matchplay?state=…. Spectator: use Spectator display tabs or /design-system/preview/spectator?state=…. Event fixtures board only: matchplay ?state=standings_tv."
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
          <li>Standings table (modal + fixtures board)</li>
          <li>Board fixture list &amp; activity feed (<code>/matchplay/[id]/board</code> static preview)</li>
          <li>
            Spectator TV: <code>SpectatorIdle</code>, <code>SpectatorPregame</code>, <code>SpectatorLive</code>,{' '}
            <code>SpectatorEndgame</code> (<code>/live/[courtSlug]</code>)
          </li>
        </ul>
      </section>
    </div>
  )
}
