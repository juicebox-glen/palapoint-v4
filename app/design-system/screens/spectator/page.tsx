import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

export default function SpectatorScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Spectator Display</h1>
        <p>TV/monitor display for spectators in venue bar/lounge areas. Designed for 1920×1080.</p>
      </header>

      <ScreenPreview
        title="Spectator Display"
        description="Shows match status, scores, and player information to spectators"
        viewport="tv"
        states={[
          { name: 'idle', label: 'Idle', url: '/design-system/preview/spectator?state=idle' },
          { name: 'pregame', label: 'Pre-game', url: '/design-system/preview/spectator?state=pregame' },
          { name: 'live', label: 'Live', url: '/design-system/preview/spectator?state=live' },
          { name: 'endgame', label: 'End Game', url: '/design-system/preview/spectator?state=endgame' },
        ]}
      />

      <ScreenDesignTokens
        typography={[
          {
            token: "var(--font-family) ('Inter', …)",
            usage: 'Root container, header, live game/point cells (tabular nums).',
          },
          {
            token: "'Space Grotesk' + var(--font-family)",
            usage: 'Large player names: `.spectator-live-name-row` (live) and `.spectator-pregame-names` (pre-game).',
          },
          {
            token: 'clamp() + vh / vw',
            usage: 'TV scaling for logo, header, score columns, name lines.',
          },
        ]}
        colors={[
          { token: '--bg-primary', usage: 'Full viewport background (`.spectator-container`).' },
          { token: '--bg-tertiary, --border-default', usage: 'Live score cells, card strokes (often with `color-mix`).' },
          { token: '--text-primary, --text-secondary, --text-muted', usage: 'Header, badges, secondary labels.' },
          { token: '--success', usage: 'FINAL / endgame status dot.' },
          { token: '--team-a, --team-b', usage: 'Team-tinted cards, dividers, accents.' },
          { token: '--brand-primary', usage: 'Optional emphasis when wired from venue branding.' },
          {
            token: '#d0ff14, #cbccce, split-field hex',
            usage: 'Serve orb glow, pre-game name color, pre-game background split — legacy; align to `--court-*` / text tokens where possible.',
          },
        ]}
        stylesheets={[
          'app/styles/spectator.css',
          'app/styles/tokens/colors.css',
          'app/styles/tokens/typography.css',
        ]}
      />

      <section className="ds-section">
        <h2>States</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Trigger</th>
              <th>Key Elements</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Idle</td>
              <td>No active match for court</td>
              <td>Logo, &quot;No active match&quot; message</td>
            </tr>
            <tr>
              <td>Pre-game</td>
              <td>Match created with status: setup</td>
              <td>READY badge, player photos/names, VS, mode badges, animated background</td>
            </tr>
            <tr>
              <td>Live</td>
              <td>Match status: in_progress</td>
              <td>LIVE badge, score cards with photos, set dots, serve indicator, animated background</td>
            </tr>
            <tr>
              <td>End Game</td>
              <td>Match status: completed or has winner</td>
              <td>FINAL badge, winner highlight, final scores</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Components Used</h2>
        <ul className="ds-component-list">
          <li>
            <Link href="/design-system/components/headers">SpectatorHeader</Link>
          </li>
          <li>
            <Link href="/design-system/components/badges">Status Badges (READY, LIVE, FINAL)</Link>
          </li>
          <li>
            <Link href="/design-system/components/badges">Mode Badges</Link>
          </li>
          <li>
            <Link href="/design-system/components/photos">Player Photos</Link>
          </li>
          <li>
            <Link href="/design-system/components/scores">Score Cards</Link>
          </li>
          <li>GradientWaveDrift (background)</li>
        </ul>
      </section>
    </div>
  )
}
