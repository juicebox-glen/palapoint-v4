import type { ReactNode } from 'react'

export interface KinkFrameLeftContentPanelProps {
  children?: ReactNode
  className?: string
}

/** Left-side content slot — over media, outside the right glass panel. */
export function KinkFrameLeftContentPanel({ children, className }: KinkFrameLeftContentPanelProps) {
  return (
    <aside
      className={['kink-frame-left-content-panel', className].filter(Boolean).join(' ')}
      aria-label="Event details"
    >
      <div className="kink-frame-left-content-panel-inner">{children}</div>
    </aside>
  )
}
