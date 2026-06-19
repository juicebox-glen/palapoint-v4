'use client'

import PlayerFlowShell from '@/components/shared/PlayerFlowShell'
import SessionPromptCard from '@/components/shared/SessionPromptCard'
import type { VenueBranding } from '@/lib/venue'

export default function SessionProtectionPrompt({
  onCancel,
  onTakeover,
  title = 'Court In Use',
  warning = "There's an active session on this court. Taking over will end the current session.",
  takeOverLabel = 'Take Over',
  takeOverLoading = false,
  error = null,
  branding = null,
}: {
  onCancel: () => void
  onTakeover: () => void
  /** e.g. "Match in progress" when joining an existing match */
  title?: string
  warning?: string
  takeOverLabel?: string
  takeOverLoading?: boolean
  error?: string | null
  branding?: VenueBranding | null
}) {
  const busy = takeOverLoading

  return (
    <PlayerFlowShell branding={branding}>
      <div className="player-flow-prompt-wrap">
        <SessionPromptCard
          title={title}
          warning={warning}
          error={error}
          actions={
            <>
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={onTakeover}
                disabled={busy}
              >
                {busy ? '…' : takeOverLabel}
              </button>
              <button
                type="button"
                className="btn btn-secondary btn-block"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        />
      </div>
    </PlayerFlowShell>
  )
}
