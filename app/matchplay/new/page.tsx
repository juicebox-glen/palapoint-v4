'use client'

import { useState, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import MatchplaySetupBrandHeader from '@/components/matchplay/MatchplaySetupBrandHeader'
import { CourtIcon } from '@/components/matchplay/CourtIcon'
import { useMatchplaySetupBranding } from '@/lib/hooks/useMatchplaySetupBranding'
import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

const PLAYER_OPTIONS = [6, 8, 10, 12, 14, 16, 20]
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

  useEffect(() => {
    const newDefault = Math.min(playerCount - 1, 7)
    setRounds(newDefault)
  }, [playerCount])

  const restingPerRound = Math.max(0, playerCount - selectedCourts.length * 4)
  const matchesPerRound = Math.min(selectedCourts.length, Math.floor(playerCount / 4))
  const totalMatches = rounds * matchesPerRound
  const matchesPerPlayer = Math.round((totalMatches * 4) / playerCount)
  const minutesPerMatch = pointsPerMatch === 32 ? 8 : pointsPerMatch === 24 ? 6 : 4
  const estimatedMinutes = rounds * minutesPerMatch
  const estimatedDuration =
    estimatedMinutes >= 60
      ? `${Math.floor(estimatedMinutes / 60)}h ${estimatedMinutes % 60}m`
      : `${estimatedMinutes}m`

  const maxRoundOption = Math.min(fullRotation, 9)
  const roundOptions =
    maxRoundOption >= 3
      ? Array.from({ length: maxRoundOption - 2 }, (_, i) => i + 3)
      : [Math.max(1, maxRoundOption)]

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

  const canContinue = selectedCourts.length >= 1

  const brandVars =
    branding?.primaryColor != null
      ? ({
          '--brand-primary': branding.primaryColor,
        } as CSSProperties)
      : undefined

  return (
    <div className="matchplay-page matchplay-page--setup" style={brandVars}>
      <MatchplaySetupBrandHeader branding={branding} />

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
            <div className="matchplay-pill-bar">
              {PLAYER_OPTIONS.map((count) => (
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
            <span className="matchplay-card-label">Courts</span>
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
                    <CourtIcon />
                    <span className="matchplay-court-num">{court}</span>
                  </button>
                )
              })}
            </div>
            <p className="matchplay-card-hint">
              {playerCount} players · {selectedCourts.length} court{selectedCourts.length !== 1 ? 's' : ''}
              {restingPerRound > 0 ? ` · ${restingPerRound} resting per round` : ''}
            </p>
          </div>

          <div className="matchplay-card">
            <span className="matchplay-card-label">Points per match</span>
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

      <footer className="matchplay-footer">
        <button type="button" className="matchplay-btn-primary" onClick={handleContinue} disabled={!canContinue}>
          Continue
        </button>
      </footer>
    </div>
  )
}
