'use client'

import {
  KINK_FRAME_NAV_MODES,
  type KinkFrameVenueMode,
} from '@/lib/layout/kink-frame-venue-mode'

export interface KinkFrameModeNavProps {
  mode: KinkFrameVenueMode
  onModeChange: (mode: KinkFrameVenueMode) => void
  disabled?: boolean
}

/** Top-of-screen mode links — Idle, Showcase, Social, Social · Flat. */
export function KinkFrameModeNav({ mode, onModeChange, disabled = false }: KinkFrameModeNavProps) {
  return (
    <nav className="kink-frame-mode-nav" aria-label="Venue display mode">
      {KINK_FRAME_NAV_MODES.map(({ id, label }) => {
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
