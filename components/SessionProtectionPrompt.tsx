'use client'

import '@/app/styles/session-prompt.css'

export default function SessionProtectionPrompt({
  onCancel,
  onTakeover,
  title = 'Court In Use',
  warning = "There's an active session on this court. Taking over will end the current session.",
  takeOverLabel = 'Take Over',
  takeOverLoading = false,
}: {
  onCancel: () => void
  onTakeover: () => void
  /** e.g. "Match in progress" when joining an existing match */
  title?: string
  warning?: string
  takeOverLabel?: string
  takeOverLoading?: boolean
}) {
  const busy = takeOverLoading
  return (
    <div className="session-prompt-overlay">
      <div className="session-prompt-card">
        <h2 className="session-prompt-title">{title}</h2>

        <p className="session-prompt-warning">{warning}</p>

        <div className="session-prompt-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </button>
          <button type="button" className="btn btn-danger-fill" onClick={onTakeover} disabled={busy}>
            {busy ? '…' : takeOverLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
