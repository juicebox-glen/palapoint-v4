import type { ReactNode } from 'react'

export interface KinkFrameModeSectionProps {
  label: string
  broadcastIndex: number
  children: ReactNode
  className?: string
}

/** Labelled block inside a mode panel body (fixtures, list groups, etc.). */
export function KinkFrameModeSection({
  label,
  broadcastIndex,
  children,
  className,
}: KinkFrameModeSectionProps) {
  return (
    <section className={['kink-frame-mode-section', className].filter(Boolean).join(' ')}>
      <h3
        className={[
          'kink-frame-mode-section__label',
          'kink-frame-broadcast-item',
          `kink-frame-broadcast-item--${broadcastIndex}`,
        ].join(' ')}
      >
        {label}
      </h3>
      {children}
    </section>
  )
}
