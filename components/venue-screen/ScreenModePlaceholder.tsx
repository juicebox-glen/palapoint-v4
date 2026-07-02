import type { CSSProperties } from 'react'

import type { VenueScreenMode } from '@/lib/types/venue-screen'

const MODE_COPY: Record<
  Exclude<VenueScreenMode, 'idle'>,
  { title: string; subtitle: string }
> = {
  social_night: {
    title: 'Social Night',
    subtitle: 'Fixtures and standings will appear here.',
  },
  showcase_game: {
    title: 'Showcase Game',
    subtitle: 'Live scoreboard will appear here.',
  },
}

interface ScreenModePlaceholderProps {
  mode: Exclude<VenueScreenMode, 'idle'>
  displayName?: string
  brandingStyles?: CSSProperties
  subtitle?: string
}

export function ScreenModePlaceholder({
  mode,
  displayName,
  brandingStyles,
  subtitle,
}: ScreenModePlaceholderProps) {
  const copy = MODE_COPY[mode]
  const detail = subtitle ?? copy.subtitle

  return (
    <div className="venue-screen venue-screen--mode" style={brandingStyles}>
      <div className="venue-screen-mode-inner">
        <p className="venue-screen-kicker">PalaPoint Live</p>
        <h1 className="venue-screen-mode-title">{copy.title}</h1>
        {displayName ? (
          <p className="venue-screen-mode-screen">{displayName}</p>
        ) : null}
        <p className="venue-screen-mode-subtitle">{detail}</p>
      </div>
    </div>
  )
}
