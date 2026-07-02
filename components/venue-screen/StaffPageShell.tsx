'use client'

import type { CSSProperties, ReactNode } from 'react'

import { StaffFlowHeader } from '@/components/venue-screen/StaffFlowHeader'

import '@/app/styles/staff-controller.css'

interface StaffPageShellProps {
  children: ReactNode
  venueSlug?: string
  /** On /staff home — logo is inert. */
  isHomeScreen?: boolean
  /** Full-width header row (showcase, matchplay hub). */
  wideHeader?: boolean
  className?: string
  style?: CSSProperties
}

/** Header row only — use when page body needs its own layout (matchplay hub, showcase scoring). */
export function StaffFlowHeaderBar({
  venueSlug,
  isHomeScreen = false,
  wide = false,
}: {
  venueSlug?: string
  isHomeScreen?: boolean
  wide?: boolean
}) {
  const headerWrapClass = wide
    ? 'staff-flow-header-wrap staff-flow-header-wrap--wide'
    : 'staff-flow-header-wrap'

  return (
    <div className={headerWrapClass}>
      <StaffFlowHeader isHomeScreen={isHomeScreen} venueSlug={venueSlug} />
    </div>
  )
}

/** Shared staff controller chrome — one header, consistent page background. */
export function StaffPageShell({
  children,
  venueSlug,
  isHomeScreen = false,
  wideHeader = false,
  className,
  style,
}: StaffPageShellProps) {
  const headerWrapClass = wideHeader
    ? 'staff-flow-header-wrap staff-flow-header-wrap--wide'
    : 'staff-flow-header-wrap'

  return (
    <div className={['staff-page', className].filter(Boolean).join(' ')} style={style}>
      <div className={wideHeader ? undefined : 'staff-shell'}>
        <StaffFlowHeaderBar
          venueSlug={venueSlug}
          isHomeScreen={isHomeScreen}
          wide={wideHeader}
        />
        {children}
      </div>
    </div>
  )
}
