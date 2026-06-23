'use client'

import { useState } from 'react'

import { DEFAULT_VENUE_LOGO_SRC, type VenueBranding } from '@/lib/venue'

interface VenueLogoProps {
  branding?: VenueBranding | null
  className?: string
}

/** Venue logo with bundled Square One fallback when URL is missing or fails to load. */
export function VenueLogo({ branding, className = 'setup-logo-img' }: VenueLogoProps) {
  const [useFallback, setUseFallback] = useState(false)

  // Route/branding still loading — reserve space but don't flash the default logo.
  if (branding == null) {
    return <span className={className} aria-hidden role="presentation" />
  }

  const remote = branding.logoUrl?.trim()
  const src = !useFallback && remote ? remote : DEFAULT_VENUE_LOGO_SRC
  const alt = branding.companyName?.trim() || 'Square One'

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setUseFallback(true)}
    />
  )
}
