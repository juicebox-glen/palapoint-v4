'use client'

import type { CSSProperties, ReactNode } from 'react'

import { StaffFlowHeader, type StaffFlowHeaderProps } from '@/components/venue-screen/StaffFlowHeader'

import '@/app/styles/staff-controller.css'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'

export type StaffAppFrameVariant = 'palalive' | 'legacy'

export interface StaffAppFrameProps {
  children: ReactNode
  venueSlug?: string
  /** On /staff home — logo is inert. */
  isHomeScreen?: boolean
  className?: string
  style?: CSSProperties
  /** Sticky footer slot (primary CTA, safe-area padded). */
  footer?: ReactNode
  onBack?: StaffFlowHeaderProps['onBack']
  backHref?: StaffFlowHeaderProps['backHref']
  headerRight?: StaffFlowHeaderProps['headerRight']
  /**
   * `palalive` (default) — Social Night black staff tokens on the frame.
   * `legacy` — keep navy app tokens (design-system matchplay / older previews).
   */
  variant?: StaffAppFrameVariant
}

/** Single-column staff controller shell — shared header inset and body width. */
export function StaffAppFrame({
  children,
  venueSlug,
  isHomeScreen = false,
  className,
  style,
  footer,
  onBack,
  backHref,
  headerRight,
  variant = 'palalive',
}: StaffAppFrameProps) {
  return (
    <div
      className={[
        'staff-app-frame',
        variant === 'palalive' ? 'palalive-staff-shell' : null,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="staff-app-column">
        <header className="staff-app-header">
          <StaffFlowHeader
            isHomeScreen={isHomeScreen}
            venueSlug={venueSlug}
            onBack={onBack}
            backHref={backHref}
            headerRight={headerRight}
          />
        </header>

        <main className="staff-app-body">{children}</main>

        {footer ? <footer className="staff-app-footer">{footer}</footer> : null}
      </div>
    </div>
  )
}

/** @deprecated Use StaffAppFrame — kept for incremental migration. */
export const StaffPageShell = StaffAppFrame

/** @deprecated Header is part of StaffAppFrame. */
export function StaffFlowHeaderBar({
  venueSlug,
  isHomeScreen = false,
}: {
  venueSlug?: string
  isHomeScreen?: boolean
  wide?: boolean
}) {
  return (
    <header className="staff-app-header">
      <StaffFlowHeader isHomeScreen={isHomeScreen} venueSlug={venueSlug} />
    </header>
  )
}
