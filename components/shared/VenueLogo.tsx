'use client'

import { useState } from 'react'

import {
  DEFAULT_VENUE_LOGO_SRC,
  PALAPOINT_LOGO_SRC,
  type VenueBranding,
} from '@/lib/venue'

interface VenueLogoProps {
  branding?: VenueBranding | null
  className?: string
  /**
   * Use the PalaPoint product mark (ignores venue/company logo).
   * PalaLive TV shell + staff chrome always use this.
   */
  product?: boolean
}

/** Logo with PalaPoint fallback when URL is missing or fails to load. */
export function VenueLogo({
  branding,
  className = 'setup-logo-img',
  product = false,
}: VenueLogoProps) {
  const [useFallback, setUseFallback] = useState(false)

  if (product) {
    return (
      <img
        src={PALAPOINT_LOGO_SRC}
        alt="PalaPoint"
        className={className}
      />
    )
  }

  // Route/branding still loading — reserve space but don't flash the default logo.
  if (branding == null) {
    return <span className={className} aria-hidden role="presentation" />
  }

  const remote = branding.logoUrl?.trim()
  const src = !useFallback && remote ? remote : DEFAULT_VENUE_LOGO_SRC
  const alt = branding.companyName?.trim() || 'PalaPoint'

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setUseFallback(true)}
    />
  )
}
