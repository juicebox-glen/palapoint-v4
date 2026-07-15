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
          description="Real PalaLive components in preview mode, mock data throughout."
          viewport="tv"
          states={[
            { name: 'idle', label: 'Idle', url: '/design-system/preview/palalive?state=idle' },
            { name: 'social-pregame', label: 'Social · Pregame', url: '/design-system/preview/palalive?state=social-pregame' },
            { name: 'social-ingame', label: 'Social · Live', url: '/design-system/preview/palalive?state=social-ingame' },
            { name: 'social-postgame', label: 'Social · Final', url: '/design-system/preview/palalive?state=social-postgame' },
            { name: 'showcase', label: 'Showcase · Live', url: '/design-system/preview/palalive?state=showcase' },
          ]}
        />
      </section>

      <section className="ds-section">
        <h2>Staff · Showcase (phone)</h2>
        <ScreenPreview
          title="Showcase staff control"
          description="Real ControlPanel in preview mode, palalive-staff render variant — state/logic identical to the legacy control preview above it."
          viewport="mobile"
          states={[
            { name: 'staff-loading', label: 'Loading', url: '/design-system/preview/control?state=loading&variant=palalive-staff' },
            { name: 'staff-setup', label: 'Setup', url: '/design-system/preview/control?state=setup&variant=palalive-staff' },
            { name: 'staff-preview', label: 'Confirm', url: '/design-system/preview/control?state=preview&variant=palalive-staff' },
            { name: 'staff-live', label: 'Live Scoring', url: '/design-system/preview/control?state=live&variant=palalive-staff' },
            { name: 'staff-endgame', label: 'End · Win', url: '/design-system/preview/control?state=endgame&variant=palalive-staff' },
            { name: 'staff-endgame-multi', label: 'End · 2-1', url: '/design-system/preview/control?state=endgame_multi&variant=palalive-staff' },
            { name: 'staff-endgame-sweep', label: 'End · 2-0', url: '/design-system/preview/control?state=endgame_sweep&variant=palalive-staff' },
          ]}
        />
      </section>

      <section className="ds-section">
        <h2>Build status</h2>
        <ul className="ds-component-list">
          <li>Idle — built (Phase 1), mock Playtomic booking data.</li>
          <li>Social Night — built (Phase 2): pregame/ingame/postgame from real matchplay data + Realtime. `ingame-solid` mockup variant skipped (ambient stays on).</li>
          <li>
            Showcase Game — built (Phase 3): setup + in_progress share one live scoreboard UI from real live_matches
            data + Realtime, scoped to the staff-selected match via `active_showcase_match_id` rather than "latest
            for court." Serving indicator built at the locked 10px (mockup's own inset is 5px). No ratings on the
            match card, per the rebuild/integration briefs. Completed matches still use the existing
            SpectatorEndgame/MatchWinHero brief hold — no PalaLive-styled endgame treatment is designed in the
            mockup yet. `data-substate="2"` ("Last 20 Points" stats) skipped — empty in the mockup, no data source.
          </li>
          <li>
            Staff visual pass (Phase 4, in progress) — Showcase staff done: real `ControlPanel` state/Supabase logic
            unchanged, render target swapped to `components/palalive/staff/*` via a `variant="palalive-staff"` prop.
            `/staff/[venueSlug]/showcase` now renders the dark PalaLive phone UI end to end (setup → confirm → live
            → win/2-1/2-0), per `design-mockups/palalive-showcase-flow.html`. `/playing` and `/control` are
            untouched — they still render the legacy shared components. Matchplay staff hub and staff home/pairing
            restyle are next.
          </li>
        </ul>
      </section>
    </div>
  )
}
