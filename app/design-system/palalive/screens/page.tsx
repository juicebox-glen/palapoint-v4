import { ScreenPreview } from '../../components/ScreenPreview'
import { PalaLiveDsNav } from '../components/PalaLiveDsNav'
import {
  PALALIVE_STAFF_SHOWCASE_STATES,
  PALALIVE_STAFF_SOCIAL_STATES,
  PALALIVE_TV_STATES,
} from '../lib/screen-catalog'

export default function PalaLiveScreensPage() {
  return (
    <div className="pl-ds-shell pl-ds-shell--wide palalive-staff-shell">
      <PalaLiveDsNav active="/design-system/palalive/screens" />

      <header className="pl-ds-header">
        <h1>Screens</h1>
        <p>
          Production components + mock data. State list:{' '}
          <code>app/design-system/palalive/lib/screen-catalog.ts</code>.
        </p>
      </header>

      <section className="pl-ds-section">
        <h2>Venue TV · 1920×1080</h2>
        <ScreenPreview
          title="PalaLive TV"
          description="/screen/[screenSlug] — Idle, Social Night, Showcase. Charcoal shell family."
          viewport="tv"
          states={PALALIVE_TV_STATES}
        />
      </section>

      <section className="pl-ds-section">
        <h2>Staff · Showcase</h2>
        <ScreenPreview
          title="Showcase control"
          description="/staff/[venueSlug]/showcase — ControlPanel variant palalive-staff. CTAs pin to bottom."
          viewport="mobile"
          states={PALALIVE_STAFF_SHOWCASE_STATES}
        />
      </section>

      <section className="pl-ds-section">
        <h2>Staff · Social Night</h2>
        <ScreenPreview
          title="Americano staff flow"
          description="/matchplay/* with PalaLive staff chrome. Home → setup → players → hub → results."
          viewport="mobile"
          states={PALALIVE_STAFF_SOCIAL_STATES}
        />
      </section>
    </div>
  )
}
