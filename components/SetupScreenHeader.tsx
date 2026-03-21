'use client'

import type { VenueBranding } from '@/lib/supabase/venue'

/**
 * Shared header for staff (control + PIN) and player setup screens.
 * When rightContent is provided, uses spread layout (logo left, content right).
 * When branding is provided, uses venue logo/name; otherwise default Square One.
 */
export default function SetupScreenHeader({
  rightContent,
  branding,
}: {
  rightContent?: React.ReactNode
  branding?: VenueBranding | null
}) {
  const logoContent = branding ? (
    branding.logoUrl ? (
      <img
        src={branding.logoUrl}
        alt={branding.companyName}
        className="setup-logo-img"
      />
    ) : (
      <span className="setup-logo-text">{branding.companyName}</span>
    )
  ) : (
    <img
      src="/images/squareone-logo.png"
      alt="Square One"
      className="setup-logo-img"
    />
  )

  return (
    <header className={`setup-header ${rightContent ? 'setup-header--spread' : ''}`}>
      <div className="setup-header-left">{logoContent}</div>
      {rightContent && <div className="setup-header-right">{rightContent}</div>}
    </header>
  )
}
