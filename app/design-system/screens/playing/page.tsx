import Link from 'next/link'

import { ScreenPreview } from '../../components/ScreenPreview'

export default function PlayingScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Player Playing</h1>
        <p>
          Mobile companion interface for players during matches. Accessed at /playing/[company]/[venue]/[court]
        </p>
      </header>

      <ScreenPreview
        title="Player Playing"
        description="Live score display and match status for players on their phones"
        viewport="mobile"
        states={[
          { name: 'live', label: 'Live', url: '/design-system/preview/playing?state=live' },
          { name: 'finished', label: 'Finished', url: '/design-system/preview/playing?state=finished' },
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
              <td>Live</td>
              <td>Match in progress</td>
              <td>LIVE badge, &quot;Your Team&quot; indicator, score display, serve indicator, mode badges</td>
            </tr>
            <tr>
              <td>Finished</td>
              <td>Match completed</td>
              <td>MATCH COMPLETE badge, win/loss result, final score</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Features</h2>
        <ul className="ds-feature-list">
          <li>
            <strong>Your Team Highlight:</strong> The player&apos;s team is highlighted so they can quickly identify
            their score
          </li>
          <li>
            <strong>Realtime Updates:</strong> Score updates via Supabase realtime subscription
          </li>
          <li>
            <strong>Mode Display:</strong> Shows game mode (Golden/Traditional/Silver) and sets format
          </li>
          <li>
            <strong>Win/Loss Result:</strong> Personalized result message at match end
          </li>
        </ul>
      </section>

      <section className="ds-section">
        <h2>Notes</h2>
        <div className="ds-note-block">
          <p>
            <strong>Player Identification:</strong> The player&apos;s team is determined by matching their session to
            the match roster.
          </p>
          <p>
            <strong>Read-Only:</strong> Unlike staff control, players cannot score points - they can only view the
            score.
          </p>
          <p>
            <strong>Future: PalaPlay:</strong> This will eventually become the foundation for the PalaPlay companion
            app with stats, history, and social features.
          </p>
        </div>
      </section>
    </div>
  )
}
