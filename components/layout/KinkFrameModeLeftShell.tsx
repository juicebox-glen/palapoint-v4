import type { ReactNode } from 'react'

import type { KinkFrameVenueMotion } from '@/components/layout/useKinkFrameVenueTransition'

export interface KinkFrameModeLeftShellProps {
  panelKey: string
  motion: KinkFrameVenueMotion
  children: ReactNode
}

/** Left venue slot — broadcast motion without the right-side glass frame. */
export function KinkFrameModeLeftShell({ panelKey, motion, children }: KinkFrameModeLeftShellProps) {
  return (
    <div
      key={panelKey}
      className={[
        'kink-frame-courts-broadcast',
        'kink-frame-mode-left-broadcast',
        motion === 'out'
          ? 'kink-frame-courts-broadcast--out'
          : motion === 'hold'
            ? 'kink-frame-courts-broadcast--hold'
            : 'kink-frame-courts-broadcast--in',
      ].join(' ')}
    >
      <div className="kink-frame-courts">{children}</div>
    </div>
  )
}
