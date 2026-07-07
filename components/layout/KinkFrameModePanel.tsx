import type { ReactNode } from 'react'

export interface KinkFrameModePanelProps {
  label: string
  summary: string
  children: ReactNode
  className?: string
}

/** Shared header + body skeleton for idle / Showcase / Social panels. */
export function KinkFrameModePanel({ label, summary, children, className }: KinkFrameModePanelProps) {
  return (
    <div className={['kink-frame-mode-panel', className].filter(Boolean).join(' ')}>
      <header className="kink-frame-mode-panel__header">
        <div className="kink-frame-mode-panel__label kink-frame-broadcast-item kink-frame-broadcast-item--0">
          {label}
        </div>
        <div className="kink-frame-mode-panel__summary kink-frame-broadcast-item kink-frame-broadcast-item--1">
          {summary}
        </div>
      </header>
      <div className="kink-frame-mode-panel__body">{children}</div>
    </div>
  )
}
