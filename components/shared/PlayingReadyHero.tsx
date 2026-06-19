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
          <img src="/images/button.svg" alt="" width={48} height={72} />
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
        className="btn btn-secondary btn-block playing-ready-edit-btn"
        onClick={onEditMatch}
        disabled={editDisabled}
      >
        EDIT MATCH
      </button>
    </div>
  )
}
