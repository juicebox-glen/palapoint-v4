import Link from 'next/link'

import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

const MATCHPLAY_PREVIEW_BASE = '/design-system/preview/matchplay'

/** Single strip: pre-event setup through hub and linked full-screen routes (mobile). */
const STAFF_SETUP_AND_HUB_STATES: ScreenPreviewState[] = [
  { name: 'launcher', label: 'Launcher', url: `${MATCHPLAY_PREVIEW_BASE}?state=launcher`, viewport: 'mobile' },
  {
    name: 'format',
    label: 'Event setup',
    url: `${MATCHPLAY_PREVIEW_BASE}?state=format`,
    viewport: 'mobile',
  },
  { name: 'players', label: 'Add players', url: `${MATCHPLAY_PREVIEW_BASE}?state=players`, viewport: 'mobile' },
  { name: 'event', label: 'Event hub', url: `${MATCHPLAY_PREVIEW_BASE}?state=event`, viewport: 'mobile' },
  {
    name: 'event_finalize',
    label: 'Hub · finalize',
    url: `${MATCHPLAY_PREVIEW_BASE}?state=event_finalize`,
    viewport: 'mobile',
  },
  {
    name: 'hub_players',
    label: 'Roster (edit)',
    url: `${MATCHPLAY_PREVIEW_BASE}?state=hub_players`,
    viewport: 'mobile',
  },
  {
    name: 'hub_standings',
    label: 'Standings',
    url: `${MATCHPLAY_PREVIEW_BASE}?state=hub_standings`,
    viewport: 'mobile',
  },
  {
    name: 'hub_results',
    label: 'Results',
    url: `${MATCHPLAY_PREVIEW_BASE}?state=hub_results`,
    viewport: 'mobile',
  },
]

const TV_BOARD_STATES: ScreenPreviewState[] = [
  { name: 'board_setup', label: 'Starting soon', url: `${MATCHPLAY_PREVIEW_BASE}?state=board_setup` },
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
          Staff route order: <strong>Launcher</strong> (<code>/matchplay</code>) →{' '}
          <strong>Event setup</strong> (<code>/matchplay/new</code>) → <strong>Add players</strong> (
          <code>/matchplay/new/players</code>) creates the event → <strong>Event hub</strong> (
          <code>/matchplay/[id]</code>) for rounds and scoring. From the hub menu: <strong>Roster</strong> (
          <code>/matchplay/[id]/players</code>) matches the add-players layout with a single <strong>Save Changes</strong>{' '}
          footer; <strong>Standings</strong> (<code>/matchplay/[id]/standings</code>); after{' '}
          <strong>Finalize</strong>, <strong>Results</strong> (<code>/matchplay/[id]/results</code>). TV board lives at{' '}
          <code>/matchplay/[id]/board</code>.
        </p>
        <p>
          Previews use production class names (static markup, no Supabase). Query{' '}
          <code>/design-system/preview/matchplay?state=…</code>; aliases include <code>setup</code> → format,{' '}
          <code>roster</code> → roster edit, <code>standings</code> → staff standings list.
        </p>
      </header>

      <section className="ds-section">
        <h2>Staff — setup &amp; hub</h2>
        <ScreenPreview
          title="Matchplay staff flow"
          description="One sequence: launcher → New Americano → Add Players → event hub (including finalize footer variant) → roster edit, standings, and post-complete results. Tabs follow that order."
          viewport="mobile"
          states={STAFF_SETUP_AND_HUB_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>TV board</h2>
        <ScreenPreview
          title="Matchplay TV board"
          description="Starting soon, live fixtures + leaderboard, completed podium + final standings. Same markup classes as /matchplay/[id]/board."
          viewport="tv"
          states={TV_BOARD_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>Opportunities for unification</h2>
        <ul className="ds-component-list">
          <li>
            Align staff standings rows with the TV board table (or one shared column config) so Americano metrics read the
            same on phone and TV.
          </li>
          <li>
            Extract shared “status row” patterns (LIVE / SETUP / FINAL) across event hub, board header, and spectator badges
            into one small component or CSS block.
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
