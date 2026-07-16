'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { CourtIcon } from '@/components/matchplay/CourtIcon'
import { captureVenueScreenStaffContext } from '@/lib/venue-screen-staff-context'
import { useStaffSocialNightPaths } from '@/lib/hooks/useStaffSocialNightPaths'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'
import {
  MATCHPLAY_AMERICANO_PLAYER_OPTIONS,
  minCourtsForAmericano,
  recommendedCourtsForAmericano,
} from '@/lib/matchplay-americano-setup'

const COURT_OPTIONS = [1, 2, 3, 4]
const POINTS_OPTIONS = [16, 24, 32]

const SESSION_KEY = 'matchplay_setup'
const SETTINGS_KEY = 'palapoint_matchplay_settings'

export default function NewMatchplayPage() {
  const router = useRouter()
  const { path: staffPath, base: staffBase, venueSlug } = useStaffSocialNightPaths()

  const [playerCount, setPlayerCount] = useState(8)
  const [selectedCourts, setSelectedCourts] = useState<number[]>([1, 2])
  const [pointsPerMatch, setPointsPerMatch] = useState(32)
  const [rounds, setRounds] = useState(7)

  const fullRotation = playerCount - 1

  const roundOptions = useMemo(() => {
    const maxRounds = playerCount - 1
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
    setSelectedCourts(recommendedCourtsForAmericano(playerCount))
  }, [playerCount])

  const courtCapacity = selectedCourts.length * 4
  const restingPerRound = Math.max(0, playerCount - courtCapacity)

  const minCourts = minCourtsForAmericano(playerCount)
  const maxMatchesFromPlayers = minCourts
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
    router.push(staffPath('/new/players'))
  }

  const hasNoCourts = selectedCourts.length === 0
  const hasTooFewCourts = selectedCourts.length < minCourts
  const hasMoreCourtsThanNeeded = selectedCourts.length > maxMatchesFromPlayers
  const tooManyResting = restingPerRound > playerCount / 2

  const canContinue = !hasNoCourts && !hasTooFewCourts

  const validationWarnings: string[] = []
  if (hasTooFewCourts) {
    validationWarnings.push(
      `Select at least ${minCourts} court${minCourts !== 1 ? 's' : ''} for ${playerCount} players`
    )
  }
  if (hasMoreCourtsThanNeeded) {
    validationWarnings.push(
      `Only ${maxMatchesFromPlayers} court${maxMatchesFromPlayers !== 1 ? 's' : ''} needed for ${playerCount} players`
    )
  }
  if (tooManyResting) {
    validationWarnings.push('More than half will sit out each round')
  }

  return (
    <div className="palalive-staff-shell">
      <StaffAppFrame
        venueSlug={venueSlug ?? undefined}
        onBack={() => router.push(staffBase ?? '/matchplay')}
        footer={
          <button
            type="button"
            className="palalive-staff-btn palalive-staff-btn--primary"
            onClick={handleContinue}
            disabled={!canContinue}
          >
            Continue
          </button>
        }
      >
        <h1 className="palalive-staff-page-title">New Americano</h1>

        <div className="palalive-staff-body">
          <div className="palalive-staff-card">
            <span className="palalive-staff-card-label">Players</span>
            <div className="palalive-staff-pill-row">
              {MATCHPLAY_AMERICANO_PLAYER_OPTIONS.map((count) => (
                <button
                  key={count}
                  type="button"
                  className={`palalive-staff-pill ${playerCount === count ? 'is-active' : ''}`}
                  onClick={() => setPlayerCount(count)}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>

          <div className="palalive-staff-card">
            <span className="palalive-staff-card-label">Select Courts</span>
            <div className="palalive-staff-court-grid">
              {COURT_OPTIONS.map((court) => {
                const selected = selectedCourts.includes(court)
                return (
                  <button
                    key={court}
                    type="button"
                    className={`palalive-staff-court-btn ${selected ? 'is-selected' : ''}`}
                    onClick={() => toggleCourt(court)}
                    aria-pressed={selected}
                  >
                    <div className="palalive-staff-court-icon-wrap">
                      <CourtIcon />
                    </div>
                    <span className="palalive-staff-court-num">{court}</span>
                  </button>
                )
              })}
            </div>

            <div className="palalive-staff-court-summary">
              <span>
                <strong>{playerCount}</strong> players
              </span>
              <span className="palalive-staff-court-summary-divider">·</span>
              <span>
                <strong>{selectedCourts.length}</strong> court{selectedCourts.length !== 1 ? 's' : ''}
              </span>
              {restingPerRound > 0 ? (
                <>
                  <span className="palalive-staff-court-summary-divider">·</span>
                  <span className={tooManyResting ? 'palalive-staff-court-summary-warning' : ''}>
                    <strong>{restingPerRound}</strong> resting
                  </span>
                </>
              ) : null}
            </div>
          </div>

          <div className="palalive-staff-card">
            <span className="palalive-staff-card-label">Points per Match</span>
            <div className="palalive-staff-pill-row">
              {POINTS_OPTIONS.map((points) => (
                <button
                  key={points}
                  type="button"
                  className={`palalive-staff-pill ${pointsPerMatch === points ? 'is-active' : ''}`}
                  onClick={() => setPointsPerMatch(points)}
                >
                  {points}
                </button>
              ))}
            </div>
            <p className="palalive-staff-card-hint">~{minutesPerMatch} min per match</p>
          </div>

          <div className="palalive-staff-card">
            <span className="palalive-staff-card-label">Rounds</span>
            <div className="palalive-staff-pill-row">
              {roundOptions.map((r) => (
                <button
                  key={r}
                  type="button"
                  className={`palalive-staff-pill ${rounds === r ? 'is-active' : ''}`}
                  onClick={() => setRounds(r)}
                >
                  {r}
                </button>
              ))}
            </div>
            <p className="palalive-staff-card-hint">Full rotation = {fullRotation} rounds</p>
          </div>

          <div className="palalive-staff-card">
            <div className="palalive-staff-overview-row">
              <span className="palalive-staff-overview-label">Total matches</span>
              <span className="palalive-staff-overview-value">{totalMatches}</span>
            </div>
            <div className="palalive-staff-overview-row">
              <span className="palalive-staff-overview-label">Matches per player</span>
              <span className="palalive-staff-overview-value">~{matchesPerPlayer}</span>
            </div>
            <div className="palalive-staff-overview-row">
              <span className="palalive-staff-overview-label">Est. duration</span>
              <span className="palalive-staff-overview-value">{estimatedDuration}</span>
            </div>
          </div>

          {validationWarnings.length > 0 ? (
            <div role="status">
              {validationWarnings.map((warning, i) => (
                <div key={i} className="palalive-staff-warning-banner">
                  <span aria-hidden>⚠️</span>
                  <span>{warning}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </StaffAppFrame>
    </div>
  )
}
