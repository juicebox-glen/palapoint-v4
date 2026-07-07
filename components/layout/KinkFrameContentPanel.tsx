import type { ReactNode } from 'react'

export interface KinkFrameContentPanelProps {
  children?: ReactNode
  className?: string
}

/** Frosted glass panel — sits over media on the right, inside the content clip. */
export function KinkFrameContentPanel({ children, className }: KinkFrameContentPanelProps) {
  return (
    <aside
      className={['kink-frame-content-panel', className].filter(Boolean).join(' ')}
      aria-label="Content"
    >
      <div className="kink-frame-content-panel-inner">{children}</div>
    </aside>
  )
}
