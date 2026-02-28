'use client'

import '@/app/styles/session-prompt.css'

export default function SessionProtectionPrompt({
  onCancel,
  onTakeover,
}: {
  onCancel: () => void
  onTakeover: () => void
}) {
  return (
    <div className="session-prompt-overlay">
      <div className="session-prompt-card">
        <h2 className="session-prompt-title">Court In Use</h2>

        <p className="session-prompt-warning">
          There&apos;s an active session on this court. Taking over will end the
          current session.
        </p>

        <div className="session-prompt-actions">
          <button
            className="session-prompt-btn session-prompt-btn-cancel"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            className="session-prompt-btn session-prompt-btn-takeover"
            onClick={onTakeover}
          >
            Take Over
          </button>
        </div>
      </div>
    </div>
  )
}
