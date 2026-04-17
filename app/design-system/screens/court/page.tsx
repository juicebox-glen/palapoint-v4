import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

export default function CourtScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Court Display</h1>
        <p>On-court TV display showing scores to players. Designed for 1920×1080.</p>
      </header>

      <ScreenPreview
        title="Court Display"
        description="Large scoreboard visible to players on court"
        viewport="tv"
        states={[
          { name: 'idle', label: 'Idle', url: '/design-system/preview/court?state=idle' },
          { name: 'ready', label: 'Ready', url: '/design-system/preview/court?state=ready' },
          { name: 'server_select', label: 'Server Select', url: '/design-system/preview/court?state=server_select' },
          { name: 'live', label: 'Live', url: '/design-system/preview/court?state=live' },
          { name: 'deuce', label: 'Deuce', url: '/design-system/preview/court?state=deuce' },
          { name: 'advantage', label: 'Advantage', url: '/design-system/preview/court?state=advantage' },
          { name: 'game_point', label: 'Game Point', url: '/design-system/preview/court?state=game_point' },
          { name: 'set_point', label: 'Set Point', url: '/design-system/preview/court?state=set_point' },
          { name: 'match_point', label: 'Match Point', url: '/design-system/preview/court?state=match_point' },
          { name: 'tiebreak', label: 'Tiebreak', url: '/design-system/preview/court?state=tiebreak' },
          { name: 'side_swap', label: 'Side Swap', url: '/design-system/preview/court?state=side_swap' },
          { name: 'game_won', label: 'Game Won', url: '/design-system/preview/court?state=game_won' },
          { name: 'set_won', label: 'Set Won', url: '/design-system/preview/court?state=set_won' },
          { name: 'match_won', label: 'Match Won', url: '/design-system/preview/court?state=match_won' },
        ]}
      />

      <ScreenDesignTokens
        typography={[
          {
            token: "var(--font-family) ('Inter', …)",
            usage: 'Scoreboard team names, overlays, idle copy (`court-display.css`).',
          },
          {
            token: 'vw / clamp() scale',
            usage: 'Large scores (e.g. `.game-score` ~26vw), idle/ready copy — not the `--ui-font-*` rem scale.',
          },
          {
            token: "'Space Grotesk'",
            usage: 'Not used on court display; numerals are Inter at vw sizes.',
          },
        ]}
        colors={[
          { token: '--bg-primary', usage: 'Default screen wrapper and idle background.' },
          { token: '--team-a, --team-b, --brand-primary', usage: 'Venue theming; serve border, team-tinted UI.' },
          { token: '#121212 / #0A0A0B', usage: 'Fixed tile halves on live scoreboard (`.tile.team-1-dark` / `.team-2-dark`).' },
          { token: '--court-accent, --court-ball, --court-ball-border', usage: 'Idle/overlay accents and server announcement ball.' },
          { token: '#171A21, #3F66F4, #E6EAF2, #C0C0C0', usage: 'Square One idle frame (`.court-idle-square-one`) — legacy hex; align to tokens over time.' },
        ]}
        stylesheets={[
          'app/styles/court-display.css',
          'app/styles/tokens/colors.css',
          'app/styles/tokens/typography.css',
        ]}
        note="Some court labels still use hard-coded hex alongside tokens; treat the table as the audit list for consolidation."
      />

      <section className="ds-section">
        <h2>States Overview</h2>

        <h3>Setup States</h3>
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
              <td>Idle</td>
              <td>No active match</td>
              <td>Logo, &quot;Hold button to start&quot;, QR code</td>
            </tr>
            <tr>
              <td>Ready</td>
              <td>Match created (status: setup)</td>
              <td>Team names split screen, &quot;Press button to start&quot;</td>
            </tr>
            <tr>
              <td>Server Select</td>
              <td>Match started; server announcement phase</td>
              <td>Server announcement overlay (bouncing ball, then serve side)</td>
            </tr>
          </tbody>
        </table>

        <h3>Live States</h3>
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
              <td>Live</td>
              <td>Normal gameplay</td>
              <td>Scoreboard with points, games, serve indicator</td>
            </tr>
            <tr>
              <td>Deuce</td>
              <td>Both teams at 40–40</td>
              <td>Scoreboard shows 40–40</td>
            </tr>
            <tr>
              <td>Advantage</td>
              <td>One team has advantage after deuce</td>
              <td>Scoreboard shows ADV for leading team</td>
            </tr>
            <tr>
              <td>Tiebreak</td>
              <td>Games at 6–6</td>
              <td>Tie-break label; points as 1, 2, 3… (not 15, 30, 40)</td>
            </tr>
          </tbody>
        </table>

        <h3>Point Situation States</h3>
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
              <td>Game Point</td>
              <td>Leading 40–x (not yet set/match point)</td>
              <td>40 vs lower score; no set/match badge until logic applies</td>
            </tr>
            <tr>
              <td>Set Point</td>
              <td>Next point wins the set (not match-deciding)</td>
              <td>Scoreboard + SET POINT badge</td>
            </tr>
            <tr>
              <td>Match Point</td>
              <td>Next point wins the match</td>
              <td>Scoreboard + MATCH POINT badge</td>
            </tr>
          </tbody>
        </table>

        <h3>Transition Overlays</h3>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Trigger</th>
              <th>Display</th>
              <th>Duration</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Side Swap</td>
              <td>After odd total games (and tie-break rules)</td>
              <td>&quot;CHANGE ENDS&quot; overlay</td>
              <td>~3 seconds</td>
            </tr>
            <tr>
              <td>Game Won</td>
              <td>Game completed</td>
              <td>Scoreboard updates to new game (no separate flash in current UI)</td>
              <td>—</td>
            </tr>
            <tr>
              <td>Set Won</td>
              <td>Set completed</td>
              <td>&quot;SET [TEAM]&quot; overlay with score</td>
              <td>~4 seconds</td>
            </tr>
            <tr>
              <td>Match Won</td>
              <td>Match completed</td>
              <td>Winner celebration, final score</td>
              <td>Persistent</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Components Used</h2>
        <ul className="ds-component-list">
          <li>IdleLogo</li>
          <li>Ready screen (split team display)</li>
          <li>ServerAnnouncementOverlay</li>
          <li>Scoreboard</li>
          <li>Point situation badge (set / match point)</li>
          <li>SideSwapOverlay</li>
          <li>SetWinOverlay</li>
          <li>MatchWinOverlay</li>
        </ul>
      </section>

      <section className="ds-section">
        <h2>Implementation Notes</h2>
        <div className="ds-note-block">
          <p>
            <strong>Overlay timing:</strong> Overlays are triggered by score changes and auto-dismiss after a set
            duration. The CourtDisplay component manages these transitions internally.
          </p>
          <p>
            <strong>FLIC button integration:</strong> Physical buttons on court trigger score updates. Left button =
            Team A point, Right button = Team B point.
          </p>
          <p>
            <strong>Side swap logic:</strong> Triggered after games 1, 3, 5, 7… (every odd total game count). In
            tie-breaks, also swap every 6 points.
          </p>
        </div>
      </section>
    </div>
  )
}
