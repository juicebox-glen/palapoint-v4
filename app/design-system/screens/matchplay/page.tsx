import Link from 'next/link'

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
        <p>Staff tablet flows and venue TV board — static previews with production CSS.</p>
      </header>

      <section className="ds-section">
        <h2>Staff (tablet)</h2>
        <ScreenPreview
          title="Staff Matchplay"
          description="Launcher, format, players, event hub."
          viewport="tablet"
          states={STAFF_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>TV board</h2>
        <ScreenPreview
          title="Matchplay TV board"
          description="Starting soon, live leaderboard + fixtures, completed podium."
          viewport="tv"
          states={TV_BOARD_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>Opportunities for unification</h2>
        <ul className="ds-component-list">
          <li>
            Align staff standings modal columns with the TV board table (or one shared column config) so Americano
            metrics read the same on tablet and TV.
          </li>
          <li>
            Extract shared “status row” patterns (LIVE / SETUP / FINAL) across event hub, board header, and spectator
            badges into one small component or CSS block.
          </li>
          <li>
            One empty/loading primitive for launcher, board fetch, and event hub instead of three slightly different
            treatments.
          </li>
        </ul>
      </section>
    </div>
  )
}
