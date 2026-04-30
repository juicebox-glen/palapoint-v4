import Link from 'next/link'

import { ScreenPreview, type ScreenPreviewState } from '../../components/ScreenPreview'

const MATCHPLAY_PREVIEW_BASE = '/design-system/preview/matchplay'

const STAFF_STATES: ScreenPreviewState[] = [
  { name: 'launcher', label: 'Launcher', url: `${MATCHPLAY_PREVIEW_BASE}?state=launcher`, viewport: 'mobile' },
  {
    name: 'format',
    label: 'Event Setup',
    url: `${MATCHPLAY_PREVIEW_BASE}?state=format`,
    viewport: 'mobile',
  },
  { name: 'players', label: 'Add Players', url: `${MATCHPLAY_PREVIEW_BASE}?state=players`, viewport: 'mobile' },
  { name: 'event', label: 'Event Hub', url: `${MATCHPLAY_PREVIEW_BASE}?state=event`, viewport: 'mobile' },
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
          Staff flow: launcher → Event Setup → Add Players → event hub. Event Setup and Add Players use the same
          card-based layout and pill bars as game setup (<code>setup-form.css</code> logo class + <code>matchplay.css</code>{' '}
          setup tokens). TV board previews mirror fixtures with avatars and standings with photo cells.
        </p>
      </header>

      <section className="ds-section">
        <h2>Staff</h2>
        <ScreenPreview
          title="Staff Matchplay"
          description="Mobile frame for launcher, Event Setup, Add Players, and event hub. Launcher only uses SetupScreenHeader; setup screens match /matchplay/new."
          viewport="mobile"
          states={STAFF_STATES}
        />
      </section>

      <section className="ds-section">
        <h2>TV board</h2>
        <ScreenPreview
          title="Matchplay TV board"
          description="Starting soon, live leaderboard + fixtures (team photos / initials), completed podium. Same markup classes as /matchplay/[id]/board. Fixture pair labels use formatTeamDisplay (first names); standings cells use formatPlayerName(full) + getPlayerInitials from @/lib/utils/name-format."
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
