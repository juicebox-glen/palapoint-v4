'use client'

import { useEffect, useRef, useCallback } from 'react'

interface SetWinOverlayProps {
  winningTeam: 'a' | 'b'
  setNumber: number
  score: { teamA: number; teamB: number }
  teamAName?: string
  teamBName?: string
  onComplete: () => void
}

export default function SetWinOverlay({
  winningTeam,
  setNumber,
  score,
  teamAName,
  teamBName,
  onComplete
}: SetWinOverlayProps) {
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  // Auto-complete after 10 seconds
  useEffect(() => {
    const timer = setTimeout(handleComplete, 10000)
    return () => clearTimeout(timer)
  }, [handleComplete])

  const winnerName = winningTeam === 'a' 
    ? (teamAName || 'TEAM A')
    : (teamBName || 'TEAM B')

  const borderColor = winningTeam === 'a' 
    ? 'var(--color-team-a)' 
    : 'var(--color-team-b)'

  return (
    <div className="set-win-overlay court-background">
      <div className="set-win-border" style={{ borderColor }} />
      
      <div className="set-win-content">
        <h1 className="set-win-title">
          {winnerName} WINS SET {setNumber}
        </h1>
        <div className="set-win-score">
          <span className="set-win-score-value">{score.teamA}</span>
          <span className="set-win-score-dash">-</span>
          <span className="set-win-score-value">{score.teamB}</span>
        </div>
      </div>
    </div>
  )
}
