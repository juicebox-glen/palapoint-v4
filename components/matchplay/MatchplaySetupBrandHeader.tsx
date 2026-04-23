'use client'

import type { MatchplayVenueHeaderBranding } from '@/lib/supabase'

export default function MatchplaySetupBrandHeader({
  branding,
}: {
  branding: MatchplayVenueHeaderBranding | null
}) {
  return (
    <header className="matchplay-brand-header">
      {branding?.logoUrl ? (
        <img src={branding.logoUrl} alt={branding.companyName || 'Venue'} className="setup-logo-img" />
      ) : (
        <span className="matchplay-brand-text">{branding?.companyName ?? 'PalaPoint'}</span>
      )}
    </header>
  )
}
