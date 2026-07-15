import type { CSSProperties, ReactNode } from 'react'

import { VenueLogo } from '@/components/shared/VenueLogo'
import type { VenueBranding } from '@/lib/venue'

import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-shell.css'

interface PalaLiveShellProps {
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
  /** Content for the panels grid (1120px / 580px columns) — modes supply their own card(s). */
  mainStage: ReactNode
  /** Weather/clock cluster; the logo (left) is owned by the shell since it's shared across modes. */
  bottomBarRight?: ReactNode
  /** e.g. 'palalive-stage--idle' for mode-specific stage chrome. */
  stageClassName?: string
  stageStyle?: CSSProperties
}

export function PalaLiveShell({
  branding,
  brandingStyles,
  mainStage,
  bottomBarRight,
  stageClassName,
  stageStyle,
}: PalaLiveShellProps) {
  const stageClass = ['palalive-stage', stageClassName].filter(Boolean).join(' ')

  return (
    <div className="palalive-shell" style={brandingStyles}>
      <div className="palalive-frame-inner">
        <div className={stageClass} style={stageStyle}>
          <div className="palalive-panels">{mainStage}</div>
          <div className="palalive-bottom-bar">
            <VenueLogo product branding={branding} className="palalive-brand-mark" />
            <div className="palalive-bottom-right">{bottomBarRight}</div>
          </div>
        </div>
      </div>
    </div>
  )
}
