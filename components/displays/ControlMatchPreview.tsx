'use client'

import MatchConfirmation from '@/components/shared/MatchConfirmation'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'

interface ControlMatchPreviewProps {
  match: MatchState
  branding?: VenueBranding | null
  courtName: string
  onBackToEdit: () => void
  onStartMatch: () => void
  loading?: boolean
  error?: string | null
}

export default function ControlMatchPreview({
  match,
  branding,
  courtName,
  onBackToEdit,
  onStartMatch,
  loading,
  error,
}: ControlMatchPreviewProps) {
  return (
    <MatchConfirmation
      match={match}
      branding={branding}
      courtName={courtName}
      error={error}
      actions={
        <>
          <button
            type="button"
            className="btn btn-secondary btn-block"
            onClick={onBackToEdit}
            disabled={!!loading}
          >
            EDIT MATCH
          </button>
          <button
            type="button"
            className="btn btn-primary btn-block"
            onClick={onStartMatch}
            disabled={!!loading}
          >
            {loading ? 'STARTING…' : 'START MATCH'}
          </button>
        </>
      }
    />
  )
}
