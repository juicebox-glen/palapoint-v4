'use client'

import { useEffect, useRef, useCallback } from 'react'
import type { MatchState } from '@/lib/types/match'
import { MatchWinHero } from '@/components/shared/MatchWinHero'
import { resolveFinishedWinnerSide } from '@/components/shared/MatchFinishedPanel'

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

  useEffect(() => {
    const timer = setTimeout(handleComplete, 15000)
    return () => clearTimeout(timer)
  }, [handleComplete])

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'r' || key === 'q' || key === 'p' || key === 'a' || key === 'l' || key === ' ') {
        handleComplete()
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleComplete])

  const winnerTeam = resolveFinishedWinnerSide(match)
  if (winnerTeam === null) return null

  const borderColor = winnerTeam === 'a' ? 'var(--team-a)' : 'var(--team-b)'

  return (
    <div className="match-win-overlay screen-wrapper">
      <div className="screen-content screen-bordered" style={{ borderColor }}>
        <div className="screen-border" style={{ borderColor }} />

        <div className="content-centered">
          <MatchWinHero match={match} />
        </div>
      </div>

      <div className="match-win-footer">
        <p className="match-win-instruction">Press any key to continue</p>
      </div>
    </div>
  )
}
