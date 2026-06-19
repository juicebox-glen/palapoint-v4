'use client'

import type { ReactNode } from 'react'

import '@/app/styles/session-prompt.css'

export interface SessionPromptCardProps {
  title: string
  warning?: string
  error?: string | null
  actions?: ReactNode
  children?: ReactNode
}

/** Centered prompt card used for court-in-use, session ended, and related player gates. */
export default function SessionPromptCard({
  title,
  warning,
  error = null,
  actions,
  children,
}: SessionPromptCardProps) {
  return (
    <div className="session-prompt-card">
      <div className="session-prompt-body">
        <h2 className="session-prompt-title">{title}</h2>
        {warning ? <p className="session-prompt-warning">{warning}</p> : null}
        {children}
        {error ? (
          <p
            className="session-prompt-warning"
            style={{ color: 'var(--error)', marginTop: '0.5rem', fontSize: '0.875rem' }}
            role="alert"
          >
            {error}
          </p>
        ) : null}
      </div>
      {actions ? <div className="session-prompt-actions">{actions}</div> : null}
    </div>
  )
}
