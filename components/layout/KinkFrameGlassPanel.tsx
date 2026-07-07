import type { ReactNode } from 'react'

import type { KinkFrameVenueMotion } from '@/components/layout/useKinkFrameVenueTransition'

export interface KinkFrameGlassPanelProps {
  panelKey: string
  motion: KinkFrameVenueMotion
  children: ReactNode
}

/** Shared glass broadcast shell for venue content panels. */
export function KinkFrameGlassPanel({ panelKey, motion, children }: KinkFrameGlassPanelProps) {
  return (
    <div
      key={panelKey}
      className={[
        'kink-frame-courts-broadcast',
        'kink-frame-courts-broadcast--on-air',
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
