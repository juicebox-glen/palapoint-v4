'use client'

import type { ReactNode } from 'react'

import SetupScreenHeader from '@/components/SetupScreenHeader'
import { brandingStylesFor, type VenueBranding } from '@/lib/venue'

import '@/app/styles/control-panel.css'

export interface PlayerFlowShellProps {
  branding?: VenueBranding | null
  children: ReactNode
  className?: string
}

/** Shared player `/setup` + `/playing` shell: venue header + primary background. */
export default function PlayerFlowShell({
  branding = null,
  children,
  className = '',
}: PlayerFlowShellProps) {
  return (
    <div
      className={`control-panel control-panel--player ${className}`.trim()}
      style={brandingStylesFor(branding)}
    >
      <div className="control-container">
        <SetupScreenHeader branding={branding} />
        <div className="player-flow-body">{children}</div>
      </div>
    </div>
  )
}
