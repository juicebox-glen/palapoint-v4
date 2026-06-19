'use client'

import type { VenueBranding } from '@/lib/venue'
import { VenueLogo } from '@/components/shared/VenueLogo'

/**
 * Shared header for staff (control + PIN) and player setup screens.
 * When rightContent is provided, uses spread layout (logo left, content right).
 */
export default function SetupScreenHeader({
  rightContent,
  branding,
}: {
  rightContent?: React.ReactNode
  branding?: VenueBranding | null
}) {
  return (
    <header className={`setup-header ${rightContent ? 'setup-header--spread' : ''}`}>
      <div className="setup-header-left">
        <VenueLogo branding={branding} />
      </div>
      {rightContent && <div className="setup-header-right">{rightContent}</div>}
    </header>
  )
}
