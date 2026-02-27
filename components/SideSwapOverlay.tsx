'use client'

import { useEffect, useRef, useCallback } from 'react'

interface SideSwapOverlayProps {
  servingTeam: 'a' | 'b'
  sidesSwapped: boolean
  onComplete: () => void
}

export default function SideSwapOverlay({
  servingTeam,
  sidesSwapped,
  onComplete
}: SideSwapOverlayProps) {
  const completedRef = useRef(false)

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  // Auto-complete after 10 seconds (V3 behavior)
  useEffect(() => {
    const timer = setTimeout(handleComplete, 10000)
    return () => clearTimeout(timer)
  }, [handleComplete])

  // Allow skipping with any key press (V3 behavior)
  useEffect(() => {
    const handleKeyPress = () => handleComplete()
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [handleComplete])

  // V3 logic: which team is on which side BEFORE this swap
  const teamAOnLeft = !sidesSwapped
  const teamAServing = servingTeam === 'a'

  // Serving team circle (top position)
  const servingColor = teamAServing ? 'var(--color-team-a)' : 'var(--color-team-b)'
  const servingOnLeft = (teamAServing && teamAOnLeft) || (!teamAServing && !teamAOnLeft)

  // Receiving team circle (bottom position)
  const receivingColor = teamAServing ? 'var(--color-team-b)' : 'var(--color-team-a)'
  const receivingOnLeft = !servingOnLeft

  return (
    <div className="screen-wrapper">
      <div className="screen-content screen-bordered">
        <div className="side-swap-icon-bg" />

        <div className="side-swap-circles">
          <div
            className={`side-swap-circle ${servingOnLeft ? 'side-swap-left-top' : 'side-swap-right-top'}`}
            style={{ backgroundColor: servingColor }}
          />
          <div
            className={`side-swap-circle ${receivingOnLeft ? 'side-swap-left-bottom' : 'side-swap-right-bottom'}`}
            style={{ backgroundColor: receivingColor }}
          />
        </div>

        <div className="content-centered">
          <div className="side-swap-text-overlay">
            <h1 className="side-swap-title">SWAP<br />SIDES</h1>
          </div>
        </div>
      </div>
    </div>
  )
}
