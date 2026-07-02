'use client'

import { useState, useEffect, useMemo, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { CourtIcon } from '@/components/matchplay/CourtIcon'
import { useMatchplaySetupBranding } from '@/lib/hooks/useMatchplaySetupBranding'
import { captureVenueScreenStaffContext } from '@/lib/venue-screen-staff-context'
import { StaffFlowHeader } from '@/components/venue-screen/StaffFlowHeader'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'
import { MATCHPLAY_AMERICANO_PLAYER_OPTIONS } from '@/lib/matchplay-americano-setup'

const COURT_OPTIONS = [1, 2, 3, 4]
const POINTS_OPTIONS = [16, 24, 32]

const SESSION_KEY = 'matchplay_setup'
const SETTINGS_KEY = 'palapoint_matchplay_settings'

export default function NewMatchplayPage() {
  const router = useRouter()
  const branding = useMatchplaySetupBranding()

  const [playerCount, setPlayerCount] = useState(8)
  const [selectedCourts, setSelectedCourts] = useState<number[]>([1, 2])
  const [pointsPerMatch, setPointsPerMatch] = useState(32)
  const [rounds, setRounds] = useState(7)

  const fullRotation = playerCount - 1

  const roundOptions = useMemo(() => {
    const maxRounds = Math.min(playerCount - 1, 9)
    const options: number[] = []
    for (let r = 3; r <= maxRounds; r++) {
      options.push(r)
    }
    return options
  }, [playerCount])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    captureVenueScreenStaffContext({
      venueSlug: params.get('venue'),
      screenSlug: params.get('screen'),
    })
  }, [])

  useEffect(() => {
    const newFullRotation = playerCount - 1
    const newDefault = Math.min(newFullRotation, 7)
    setRounds(newDefault)
  }, [playerCount])

  const courtCapacity = selectedCourts.length * 4
  const restingPerRound = Math.max(0, playerCount - courtCapacity)

  const maxMatchesFromPlayers = Math.floor(playerCount / 4)
  const matchesPerRound = Math.min(selectedCourts.length, maxMatchesFromPlayers)

  const totalMatches = rounds * matchesPerRound
  const totalPlayerSlots = totalMatches * 4
  const matchesPerPlayer = Math.round(totalPlayerSlots / playerCount)

  const minutesPerMatch = pointsPerMatch === 32 ? 8 : pointsPerMatch === 24 ? 6 : 4
  const estimatedMinutes = rounds * minutesPerMatch
  const estimatedDuration =
    estimatedMinutes >= 60
      ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
      : `${estimatedMinutes}m`

  const toggleCourt = (court: number) => {
    setSelectedCourts((prev) =>
      prev.includes(court) ? prev.filter((c) => c !== court) : [...prev, court].sort((a, b) => a - b)
    )
  }

  const handleContinue = () => {
    const payload = {
      playerCount,
      selectedCourts,
      pointsPerMatch,
      rounds,
      format: 'americano',
    }
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload))
      localStorage.setItem(
        SETTINGS_KEY,
        JSON.stringify({
          courtCount: selectedCourts.length,
          maxScore: pointsPerMatch,
          rounds,
        })
      )
    } catch {
      /* ignore quota */
    }
    router.push('/matchplay/new/players')
  }

  const hasNoCourts = selectedCourts.length === 0
  const hasMoreCourtsThanNeeded = selectedCourts.length > maxMatchesFromPlayers
  const tooManyResting = restingPerRound > playerCount / 2

  const canContinue = !hasNoCourts

  const validationWarnings: string[] = []
  if (hasMoreCourtsThanNeeded) {
    validationWarnings.push(
      `Only ${maxMatchesFromPlayers} court${maxMatchesFromPlayers !== 1 ? 's' : ''} needed for ${playerCount} players`
    )
  }
  if (tooManyResting) {
    validationWarnings.push('More than half will sit out each round')
  }

  const brandVars =
    branding?.primaryColor != null
      ? ({
          '--brand-primary': branding.primaryColor,
        } as CSSProperties)
      : undefined

  return (
    <div className="matchplay-page matchplay-page--setup" style={brandVars}>
      <div className="staff-flow-header-wrap">
        <StaffFlowHeader />
      </div>
      <div className="matchplay-page-header">
        <button type="button" onClick={() => router.back()} className="matchplay-back-btn">
          ← Back
        </button>
        <h1 className="matchplay-page-title">New Americano</h1>
        <span className="matchplay-page-header-spacer" aria-hidden />
      </div>

      <div className="matchplay-setup-inner">
        <div className="matchplay-setup-content">
          <div className="matchplay-card">
            <span className="matchplay-card-label">Players</span>
            <div className="matchplay-pill-bar matchplay-pill-bar--players">
              {MATCHPLAY_AMERICANO_PLAYER_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`matchplay-pill-bar-item ${playerCount === count ? 'matchplay-pill-bar-item--selected' : ''}`}
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="matchplay-card">
            <span className="matchplay-card-label">Select Courts</span>
            <div className="matchplay-court-grid">
              {COURT_OPTIONS.map((court) => {
                const selected = selectedCourts.includes(court)
                return (
                  <button
                    key={court}
                    type="button"
                    className={`matchplay-court-btn ${selected ? 'matchplay-court-btn--selected' : ''}`}
                    onClick={() => toggleCourt(court)}
                    aria-pressed={selected}
                  >
                    <div className="matchplay-court-icon-wrap">
                      <CourtIcon />
                    </div>
                    <span className="matchplay-court-num">{court}</span>
                  </button>
                )
              })}
            </div>

            <div className="matchplay-court-summary">
              <span className="matchplay-court-summary-item">
                <strong>{playerCount}</strong> players
              </span>
              <span className="matchplay-court-summary-divider">·</span>
              <span className="matchplay-court-summary-item">
                <strong>{selectedCourts.length}</strong> court{selectedCourts.length !== 1 ? 's' : ''}
              </span>
              {restingPerRound > 0 ? (
                <>
                  <span className="matchplay-court-summary-divider">·</span>
                  <span
                    className={`matchplay-court-summary-item ${tooManyResting ? 'matchplay-court-summary-warning' : ''}`}
                  >
                    <strong>{restingPerRound}</strong> resting
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="matchplay-card">
            <span className="matchplay-card-label">Points per Match</span>
            <div className="matchplay-pill-bar">
              {POINTS_OPTIONS.map((points) => (
                <button
                  key={points}
                  type="button"
                  className={`matchplay-pill-bar-item ${pointsPerMatch === points ? 'matchplay-pill-bar-item--selected' : ''}`}
                  onClick={() => setPointsPerMatch(points)}
                >
                  {points}
                </button>
              ))}
            </div>
            <p className="matchplay-card-hint">~{minutesPerMatch} min per match</p>
          </div>

          <div className="matchplay-card">
            <span className="matchplay-card-label">Rounds</span>
            <div className="matchplay-pill-bar">
              {roundOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`matchplay-pill-bar-item ${rounds === r ? 'matchplay-pill-bar-item--selected' : ''}`}
                  onClick={() => setRounds(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="matchplay-card-hint">Full rotation = {fullRotation} rounds</p>
          </div>

          <div className="matchplay-card matchplay-card--overview">
            <div className="matchplay-overview-row">
              <span className="matchplay-overview-label">Total matches</span>
              <span className="matchplay-overview-value">{totalMatches}</span>
            </div>
            <div className="matchplay-overview-row">
              <span className="matchplay-overview-label">Matches per player</span>
              <span className="matchplay-overview-value">~{matchesPerPlayer}</span>
            </div>
            <div className="matchplay-overview-row">
              <span className="matchplay-overview-label">Est. duration</span>
              <span className="matchplay-overview-value">{estimatedDuration}</span>
            </div>
          </div>
        </div>
      </div>

      {validationWarnings.length > 0 ? (
        <div className="matchplay-validation-warnings" role="status">
          {validationWarnings.map((warning, i) => (
            <div key={i} className="matchplay-validation-warning">
              <span aria-hidden>⚠️</span>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      ) : null}

      <footer className="matchplay-footer">
        <button type="button" className="matchplay-btn-primary" onClick={handleContinue} disabled={!canContinue}>
          Continue
        </button>
      </footer>
    </div>
  )
}
