'use client'

import '@/app/styles/session-prompt.css'

interface SessionProtectionPromptProps {
  minutesActive: number
  minutesSinceActivity: number
  gamesCount: number
  onCancel: () => void
  onTakeover: () => void
}

export default function SessionProtectionPrompt({
  minutesActive,
  minutesSinceActivity,
  gamesCount,
  onCancel,
  onTakeover,
}: SessionProtectionPromptProps) {
  return (
    <div className="session-prompt-overlay">
      <div className="session-prompt-card">
        <h2 className="session-prompt-title">Court Currently In Use</h2>

        <div className="session-prompt-info">
          <div className="session-prompt-stat">
            <span className="session-prompt-label">Active session</span>
            <span className="session-prompt-value">{minutesActive} mins</span>
          </div>
          <div className="session-prompt-stat">
            <span className="session-prompt-label">Last scored</span>
            <span className="session-prompt-value">{minutesSinceActivity} mins ago</span>
          </div>
          {gamesCount > 0 && (
            <div className="session-prompt-stat">
              <span className="session-prompt-label">Games played</span>
              <span className="session-prompt-value">{gamesCount}</span>
            </div>
          )}
        </div>

        <p className="session-prompt-warning">
          Taking over will end the current session.
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
