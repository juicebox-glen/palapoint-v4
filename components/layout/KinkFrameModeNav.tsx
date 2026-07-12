'use client'

import {
  KINK_FRAME_NAV_MODES,
  type KinkFrameVenueMode,
} from '@/lib/layout/kink-frame-venue-mode'

export interface KinkFrameModeNavProps {
  mode: KinkFrameVenueMode
  onModeChange: (mode: KinkFrameVenueMode) => void
  disabled?: boolean
  /** Defaults to full venue nav (includes Social · Flat). */
  modes?: readonly { id: KinkFrameVenueMode; label: string }[]
}

/** Top-of-screen mode links — Idle, Showcase, Social. */
export function KinkFrameModeNav({
  mode,
  onModeChange,
  disabled = false,
  modes = KINK_FRAME_NAV_MODES,
}: KinkFrameModeNavProps) {
  return (
    <nav className="kink-frame-mode-nav" aria-label="Venue display mode">
      {modes.map(({ id, label }) => {
        const active = mode === id
        return (
          <button
            key={id}
            type="button"
            disabled={disabled}
            className={['kink-frame-mode-nav-link', active ? 'kink-frame-mode-nav-link--active' : '']
              .filter(Boolean)
              .join(' ')}
            aria-current={active ? 'page' : undefined}
            onClick={() => onModeChange(id)}
          >
            {label}
          </button>
        )
      })}
    </nav>
  )
}
