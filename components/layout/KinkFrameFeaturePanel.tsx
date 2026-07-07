import { KinkFrameFeatureCard } from '@/components/layout/KinkFrameFeatureCard'

/** Single-card feature panel — same glass shell height as the bookings stack. */
export function KinkFrameFeaturePanel() {
  return (
    <div className="kink-frame-courts-stack">
      <header className="kink-frame-courts-header">
        <div className="kink-frame-courts-label kink-frame-broadcast-item kink-frame-broadcast-item--0">
          Live match
        </div>
        <div className="kink-frame-courts-summary kink-frame-broadcast-item kink-frame-broadcast-item--1">
          Set 2
        </div>
      </header>

      <div className="kink-frame-courts-list kink-frame-courts-list--single">
        <KinkFrameFeatureCard />
      </div>
    </div>
  )
}
