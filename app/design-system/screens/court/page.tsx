import Link from 'next/link'

import { ScreenPreview } from '../../components/ScreenPreview'

export default function CourtScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Court display</h1>
        <p>On-court TV for players — scoreboard and overlays (1920×1080).</p>
      </header>

      <section className="ds-section">
        <h2>Screen</h2>
        <ScreenPreview
          title="Court display"
          description="Idle through match won — same preview routes as production states."
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
      </section>

      <section className="ds-section">
        <h2>Opportunities for unification</h2>
        <ul className="ds-component-list">
          <li>
            Replace remaining idle / tile hard-coded hex in <code>court-display.css</code> with design tokens (or
            documented venue theme variables) so court and lounge TVs share one palette story.
          </li>
          <li>
            Reuse spectator-style large numerals or tabular-ops rules where court score digits and spectator live scores
            should feel related.
          </li>
          <li>
            Centralize overlay timing copy (durations, “change ends”) next to other animation constants so court and
            control panel stay in sync when tuning UX.
          </li>
        </ul>
      </section>
    </div>
  )
}
