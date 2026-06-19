'use client'

interface PlayingReadyHeroProps {
  onEditMatch: () => void
  editDisabled?: boolean
}

/** Awaiting first court FLIC ack (setup confirmation + /playing ready). */
export default function PlayingReadyHero({ onEditMatch, editDisabled = false }: PlayingReadyHeroProps) {
  return (
    <div className="playing-ready-state">
      <div className="playing-ready-hero">
        <div className="playing-ready-pulse-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="9" />
            <circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" />
          </svg>
        </div>
        <p
          className="playing-ready-instruction"
          role="status"
          aria-label="Press button on court to start"
        >
          Press button on court
          <br />
          to start
        </p>
      </div>
      <button
        type="button"
        className="playing-ready-edit-link"
        onClick={onEditMatch}
        disabled={editDisabled}
      >
        Edit Match
      </button>
    </div>
  )
}
