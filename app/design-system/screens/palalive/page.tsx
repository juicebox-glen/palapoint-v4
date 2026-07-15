import Link from 'next/link'

import { ScreenPreview } from '../../components/ScreenPreview'

export default function PalaLiveScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>PalaLive venue display</h1>
        <p>
          Idle / Social Night / Showcase venue TV — replaces ScreenIdle, MatchplayBoard, and SpectatorDisplay inside
          VenueScreenDisplay (1920×1080).
        </p>
        <p className="ds-screen-note">
          All sizing uses a 1920×1080 viewport. Design-system previews render at true TV dimensions; open a preview
          in a new tab to check before deploying to a screen.
        </p>
      </header>

      <section className="ds-section">
        <h2>Screen</h2>
        <ScreenPreview
          title="PalaLive"
          description="Real PalaLive components in preview mode, mock data throughout. Showcase lands in a later build phase."
          viewport="tv"
          states={[
            { name: 'idle', label: 'Idle', url: '/design-system/preview/palalive?state=idle' },
            { name: 'social-pregame', label: 'Social · Pregame', url: '/design-system/preview/palalive?state=social-pregame' },
            { name: 'social-ingame', label: 'Social · Live', url: '/design-system/preview/palalive?state=social-ingame' },
            { name: 'social-postgame', label: 'Social · Final', url: '/design-system/preview/palalive?state=social-postgame' },
          ]}
        />
      </section>

      <section className="ds-section">
        <h2>Build status</h2>
        <ul className="ds-component-list">
          <li>Idle — built (Phase 1), mock Playtomic booking data.</li>
          <li>Social Night — built (Phase 2): pregame/ingame/postgame from real matchplay data + Realtime. `ingame-solid` mockup variant skipped (ambient stays on).</li>
          <li>Showcase Game — not started (Phase 3), still renders via the legacy SpectatorDisplay on /screen.</li>
        </ul>
      </section>
    </div>
  )
}
