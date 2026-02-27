'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { MatchState } from '@/lib/types/match'

interface MatchWinOverlayProps {
  match: MatchState
  onComplete: () => void
}

export default function MatchWinOverlay({ match, onComplete }: MatchWinOverlayProps) {
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  // Auto-complete after 15 seconds (V3 slide 0 duration)
  useEffect(() => {
    const timer = setTimeout(handleComplete, 15000)
    return () => clearTimeout(timer)
  }, [handleComplete])

  // Key press to skip or start new game (V3: R for new game, Q/P for next)
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'r') {
        handleComplete()
      } else if (key === 'q' || key === 'p' || key === 'a' || key === 'l' || key === ' ') {
        handleComplete()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleComplete])

  const winner = match.winner
  const setScores = match.set_scores || []

  const winnerName = winner === 'a'
    ? (match.team_a_player_1 || match.team_a_player_2
        ? [match.team_a_player_1, match.team_a_player_2].filter(Boolean).join(' / ')
        : 'TEAM A')
    : winner === 'b'
      ? (match.team_b_player_1 || match.team_b_player_2
          ? [match.team_b_player_1, match.team_b_player_2].filter(Boolean).join(' / ')
          : 'TEAM B')
      : 'MATCH COMPLETE'

  const borderColor = winner === 'a'
    ? 'var(--color-team-a)'
    : winner === 'b'
      ? 'var(--color-team-b)'
      : 'var(--color-text-secondary)'

  const title = match.status === 'abandoned'
    ? 'MATCH ABANDONED'
    : `${winnerName} WINS!`

  return (
    <div className="match-win-overlay screen-wrapper">
      <div className="screen-content screen-bordered" style={{ borderColor }}>
        <div className="screen-border" style={{ borderColor }} />

        <div className="content-centered">
          <div className="match-win-text-overlay">
            <h1 className="match-win-title">{title}</h1>

            {setScores.length > 0 && (
              <div className="match-win-sets">
                {setScores.map((set, index) => {
                  const setNumber = index + 1
                  const scoreA = set.team_a
                  const scoreB = set.team_b
                  const isThreeSets = setScores.length >= 3

                  return (
                    <div
                      key={setNumber}
                      className={`match-win-set-score ${isThreeSets ? 'three-sets' : ''}`}
                    >
                      <span className="match-win-score-value">{scoreA}</span>
                      <span className="match-win-score-dash">-</span>
                      <span className="match-win-score-value">{scoreB}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="match-win-footer">
        <p className="match-win-instruction">Press any key to continue</p>
      </div>
    </div>
  )
}
