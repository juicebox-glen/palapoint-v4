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
          description="Idle — real PalaLive components in preview mode, mock booking data. Social Night and Showcase states land in later build phases."
          viewport="tv"
          states={[{ name: 'idle', label: 'Idle', url: '/design-system/preview/palalive?state=idle' }]}
        />
      </section>

      <section className="ds-section">
        <h2>Build status</h2>
        <ul className="ds-component-list">
          <li>Idle — built (Phase 1), mock Playtomic booking data.</li>
          <li>Social Night — not started (Phase 2), still renders via the legacy MatchplayBoard on /screen.</li>
          <li>Showcase Game — not started (Phase 3), still renders via the legacy SpectatorDisplay on /screen.</li>
        </ul>
      </section>
    </div>
  )
}
