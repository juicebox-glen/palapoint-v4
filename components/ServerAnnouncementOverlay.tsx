'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface ServerAnnouncementOverlayProps {
  servingTeam: 'a' | 'b'
  teamAName?: string
  teamBName?: string
  onComplete: () => void
}

export default function ServerAnnouncementOverlay({
  servingTeam,
  teamAName,
  teamBName,
  onComplete
}: ServerAnnouncementOverlayProps) {
  const [phase, setPhase] = useState<1 | 2>(1)
  const ballRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)
  const completedRef = useRef(false)
  
  // Use refs for position/velocity to avoid re-renders
  const positionRef = useRef({ x: 50, y: 50 })
  const velocityRef = useRef({ x: 0.3, y: 0.2 })

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  // Phase 1: Bouncing ball animation
  useEffect(() => {
    if (phase !== 1) return

    const ball = ballRef.current
    if (!ball) return

    // Set initial position
    ball.style.left = `${positionRef.current.x}%`
    ball.style.top = `${positionRef.current.y}%`

    const animate = () => {
      let newX = positionRef.current.x + velocityRef.current.x
      let newY = positionRef.current.y + velocityRef.current.y

      // Bounce off edges (2% margin from edges)
      if (newX <= 2 || newX >= 98) {
        velocityRef.current.x = -velocityRef.current.x
        newX = Math.max(2, Math.min(98, newX))
      }
      if (newY <= 2 || newY >= 96) {
        velocityRef.current.y = -velocityRef.current.y
        newY = Math.max(2, Math.min(96, newY))
      }

      positionRef.current = { x: newX, y: newY }
      
      if (ball) {
        ball.style.left = `${newX}%`
        ball.style.top = `${newY}%`
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    // Start animation
    animationRef.current = requestAnimationFrame(animate)

    // Move to phase 2 after 3 seconds
    const phaseTimer = setTimeout(() => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      setPhase(2)
    }, 3000)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        animationRef.current = null
      }
      clearTimeout(phaseTimer)
    }
  }, [phase])

  // Phase 2: Team announcement, then complete
  useEffect(() => {
    if (phase !== 2) return

    const timer = setTimeout(handleComplete, 8000)
    return () => clearTimeout(timer)
  }, [phase, handleComplete])

  const teamColor = servingTeam === 'a' ? 'var(--color-team-a)' : 'var(--color-team-b)'
  const teamName = servingTeam === 'a' 
    ? (teamAName || 'TEAM A')
    : (teamBName || 'TEAM B')

  return (
    <div className="server-announcement-overlay court-background">
      {/* Phase 1: Selecting Server */}
      {phase === 1 && (
        <>
          <div className="server-announcement-content">
            <h1 className="server-announcement-title server-announcement-pulse">
              SELECTING<br />SERVER
            </h1>
          </div>
          <div
            ref={ballRef}
            className="server-announcement-ball"
          />
        </>
      )}

      {/* Phase 2: Team Announcement */}
      {phase === 2 && (
        <>
          {/* Half-screen serving border (left or right) */}
          <div
            className={`screen-border-serving-${servingTeam === 'a' ? 'left' : 'right'}`}
            style={{ borderColor: teamColor }}
          />

          {/* Player circles on serving team's side */}
          <div className="server-announcement-positions">
            {servingTeam === 'a' ? (
              <>
                <div
                  className="server-announcement-circle server-announcement-circle-animate"
                  style={{ 
                    backgroundColor: teamColor,
                    top: '10%',
                    left: '20%'
                  }}
                />
                <div
                  className="server-announcement-circle server-announcement-circle-animate"
                  style={{ 
                    backgroundColor: teamColor,
                    bottom: '10%',
                    left: '20%'
                  }}
                />
              </>
            ) : (
              <>
                <div
                  className="server-announcement-circle server-announcement-circle-animate"
                  style={{ 
                    backgroundColor: teamColor,
                    top: '10%',
                    right: '20%'
                  }}
                />
                <div
                  className="server-announcement-circle server-announcement-circle-animate"
                  style={{ 
                    backgroundColor: teamColor,
                    bottom: '10%',
                    right: '20%'
                  }}
                />
              </>
            )}
          </div>

          {/* Ball near serving team */}
          <div
            className="server-announcement-ball-static server-announcement-ball-animate"
            style={{
              top: '25%',
              left: servingTeam === 'a' ? '25%' : undefined,
              right: servingTeam === 'b' ? '25%' : undefined
            }}
          />

          <div className="server-announcement-content server-announcement-text-animate">
            <h1 className="server-announcement-title">
              {teamName}<br />TO SERVE
            </h1>
          </div>
        </>
      )}
    </div>
  )
}
