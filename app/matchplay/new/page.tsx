'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import '@/app/styles/matchplay.css'

const PLAYER_OPTIONS = [6, 8, 10, 12, 14, 16, 20]
const COURT_OPTIONS = [1, 2, 3, 4]
const POINTS_OPTIONS = [16, 24, 32]

const SESSION_KEY = 'matchplay_setup'
const SETTINGS_KEY = 'palapoint_matchplay_settings'

export default function NewMatchplayPage() {
  const router = useRouter()

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

  return (
    <div className="matchplay-page matchplay-page--stacked">
      <header className="matchplay-header matchplay-header--event-setup">
        <div className="matchplay-header-side">
          <button type="button" onClick={() => router.back()} className="matchplay-back">
            ← Back
          </button>
        </div>
        <h1 className="matchplay-header-title">New Americano</h1>
        <div className="matchplay-header-side matchplay-header-side--end" aria-hidden />
      </header>

      <div className="matchplay-setup-content">
        <section className="matchplay-setup-section">
          <h2 className="matchplay-setup-label">Players</h2>
          <div className="matchplay-pill-group matchplay-pill-group--wide">
            {PLAYER_OPTIONS.map((count) => (
              <button
                key={count}
                type="button"
                className={`matchplay-pill ${playerCount === count ? 'matchplay-pill--selected' : ''}`}
                onClick={() => setPlayerCount(count)}
              >
                {count}
              </button>
            ))}
          </div>
        </section>

        <section className="matchplay-setup-section">
          <h2 className="matchplay-setup-label">Courts</h2>
          <div className="matchplay-pill-group">
            {COURT_OPTIONS.map((court) => (
              <button
                key={court}
                type="button"
                className={`matchplay-pill matchplay-pill--toggle ${
                  selectedCourts.includes(court) ? 'matchplay-pill--selected' : ''
                }`}
                onClick={() => toggleCourt(court)}
              >
                {court}
              </button>
            ))}
          </div>
          <p className="matchplay-setup-hint">
            {playerCount} players · {selectedCourts.length} court{selectedCourts.length !== 1 ? 's' : ''}
            {restingPerRound > 0 ? ` · ${restingPerRound} resting per round` : ''}
          </p>
        </section>

        <section className="matchplay-setup-section">
          <h2 className="matchplay-setup-label">Points per match</h2>
          <div className="matchplay-pill-group">
            {POINTS_OPTIONS.map((points) => (
              <button
                key={points}
                type="button"
                className={`matchplay-pill ${pointsPerMatch === points ? 'matchplay-pill--selected' : ''}`}
                onClick={() => setPointsPerMatch(points)}
              >
                {points}
              </button>
            ))}
          </div>
        </section>

        <section className="matchplay-setup-section">
          <h2 className="matchplay-setup-label">Rounds</h2>
          <div className="matchplay-pill-group matchplay-pill-group--wide">
            {roundOptions.map((r) => (
              <button
                key={r}
                type="button"
                className={`matchplay-pill ${rounds === r ? 'matchplay-pill--selected' : ''}`}
                onClick={() => setRounds(r)}
              >
                {r}
              </button>
            ))}
          </div>
          <p className="matchplay-setup-hint">Full rotation = {fullRotation} rounds</p>
        </section>

        <section className="matchplay-setup-section matchplay-setup-overview">
          <div className="matchplay-overview-row">
            <span>Total matches</span>
            <span className="matchplay-overview-value">{totalMatches}</span>
          </div>
          <div className="matchplay-overview-row">
            <span>Matches per player</span>
            <span className="matchplay-overview-value">~{matchesPerPlayer}</span>
          </div>
          <div className="matchplay-overview-row">
            <span>Est. duration</span>
            <span className="matchplay-overview-value">{estimatedDuration}</span>
          </div>
        </section>
      </div>

      <footer className="matchplay-setup-footer">
        <button
          type="button"
          className="matchplay-btn matchplay-btn--primary"
          onClick={handleContinue}
          disabled={!canContinue}
        >
          Continue
        </button>
      </footer>
    </div>
  )
}
