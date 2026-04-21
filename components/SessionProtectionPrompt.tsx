'use client'

import '@/app/styles/session-prompt.css'

export default function SessionProtectionPrompt({
  onCancel,
  onTakeover,
  title = 'Court In Use',
  warning = "There's an active session on this court. Taking over will end the current session.",
  takeOverLabel = 'Take Over',
  takeOverLoading = false,
  error = null,
}: {
  onCancel: () => void
  onTakeover: () => void
  /** e.g. "Match in progress" when joining an existing match */
  title?: string
  warning?: string
  takeOverLabel?: string
  takeOverLoading?: boolean
  error?: string | null
}) {
  const busy = takeOverLoading
  return (
    <div className="session-prompt-overlay">
      <div className="session-prompt-card">
        <div className="session-prompt-body">
          <h2 className="session-prompt-title">{title}</h2>

          <p className="session-prompt-warning">{warning}</p>

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

        <div className="session-prompt-actions">
          <button type="button" className="btn btn-primary btn-block" onClick={onTakeover} disabled={busy}>
            {busy ? '…' : takeOverLabel}
          </button>
          <button type="button" className="btn btn-ghost btn-block" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
