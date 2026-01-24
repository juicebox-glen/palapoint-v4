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

  // Auto-complete after 5 seconds
  useEffect(() => {
    const timer = setTimeout(handleComplete, 5000)
    return () => clearTimeout(timer)
  }, [handleComplete])

  // Determine which team is on which side BEFORE this swap
  // sidesSwapped represents the state AFTER the swap completes
  // The animation shows teams moving FROM their old positions TO their new positions
  
  // When sidesSwapped = true (teams are now swapped):
  // - Team A was on LEFT, now moving to RIGHT
  // - Team B was on RIGHT, now moving to LEFT
  // So: Team A circle starts on LEFT (top-left), animates RIGHT
  //     Team B circle starts on RIGHT (bottom-right), animates LEFT
  
  // When sidesSwapped = false (teams back to normal):
  // - Team A was on RIGHT (when swapped), now moving back to LEFT
  // - Team B was on LEFT (when swapped), now moving back to RIGHT
  // So: Team A circle starts on RIGHT (top-right), animates LEFT
  //     Team B circle starts on LEFT (bottom-left), animates RIGHT

  // Starting positions (where teams WERE before this swap)
  const teamAStartsOnLeft = sidesSwapped  // If swapped now, A was on left before
  const teamBStartsOnLeft = !sidesSwapped // If swapped now, B was on right before

  return (
    <div className="side-swap-overlay">
      {/* Spinning swap icon */}
      <div className="side-swap-icon-bg" />

      {/* Player circles - represent teams moving to new positions */}
      <div className="side-swap-circles">
        {/* Team A circle (teal/green) */}
        <div
          className={`side-swap-circle ${teamAStartsOnLeft ? 'side-swap-circle-top-left' : 'side-swap-circle-top-right'}`}
          style={{ backgroundColor: 'var(--color-team-a)' }}
        />

        {/* Team B circle (purple) */}
        <div
          className={`side-swap-circle ${teamBStartsOnLeft ? 'side-swap-circle-bottom-left' : 'side-swap-circle-bottom-right'}`}
          style={{ backgroundColor: 'var(--color-team-b)' }}
        />
      </div>

      {/* Text overlay */}
      <div className="side-swap-text-overlay">
        <h1 className="side-swap-title">SWAP<br />SIDES</h1>
      </div>
    </div>
  )
}
