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

  const positionRef = useRef({ x: 50, y: 50 })
  const velocityRef = useRef({ x: 0.3, y: 0.2 })

  const handleComplete = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    onComplete()
  }, [onComplete])

  // Phase 1: Bouncing ball animation (3s)
  useEffect(() => {
    if (phase !== 1) return

    const ball = ballRef.current
    if (!ball) return

    ball.style.left = `${positionRef.current.x}%`
    ball.style.top = `${positionRef.current.y}%`

    const animate = () => {
      let newX = positionRef.current.x + velocityRef.current.x
      let newY = positionRef.current.y + velocityRef.current.y

      if (newX <= 2 || newX >= 98) {
        velocityRef.current.x = -velocityRef.current.x
        newX = Math.max(2, Math.min(98, newX))
      }
      if (newY <= 2 || newY >= 94) {
        velocityRef.current.y = -velocityRef.current.y
        newY = Math.max(2, Math.min(94, newY))
      }

      positionRef.current = { x: newX, y: newY }
      ball.style.left = `${newX}%`
      ball.style.top = `${newY}%`

      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

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

  // Phase 2: Auto-complete after 8 seconds, or key press to skip (V3 behavior)
  useEffect(() => {
    if (phase !== 2) return

    const timer = setTimeout(handleComplete, 8000)

    const handleKeyPress = () => handleComplete()
    window.addEventListener('keydown', handleKeyPress)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [phase, handleComplete])

  const teamColor = servingTeam === 'a' ? 'var(--color-team-a)' : 'var(--color-team-b)'
  const isTeamA = servingTeam === 'a'
  const teamName = servingTeam === 'a'
    ? (teamAName || 'TEAM A')
    : (teamBName || 'TEAM B')

  return (
    <div className="screen-wrapper">
      <div className="screen-content screen-bordered">
        {phase === 1 && (
          <>
            <div className="content-centered">
              <div className="server-announcement-text-overlay">
                <h1 className="server-announcement-title server-announcement-title-selecting">
                  SELECTING<br />SERVER
                </h1>
              </div>
            </div>
            <div
              ref={ballRef}
              className="server-announcement-bouncing-ball"
            />
          </>
        )}

        {phase === 2 && (
          <>
            <div
              className={`screen-border-serving-${isTeamA ? 'left' : 'right'}`}
              style={{ borderColor: teamColor }}
            />

            <div className="server-announcement-player-positions">
              {isTeamA ? (
                <>
                  <div
                    className="server-announcement-player-circle server-announcement-player-team-a-top"
                    style={{ backgroundColor: teamColor }}
                  />
                  <div
                    className="server-announcement-player-circle server-announcement-player-team-a-bottom"
                    style={{ backgroundColor: teamColor }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="server-announcement-player-circle server-announcement-player-team-b-top"
                    style={{ backgroundColor: teamColor }}
                  />
                  <div
                    className="server-announcement-player-circle server-announcement-player-team-b-bottom"
                    style={{ backgroundColor: teamColor }}
                  />
                </>
              )}
            </div>

            <div
              className={`server-announcement-ball ${
                isTeamA ? 'server-announcement-ball-team-a' : 'server-announcement-ball-team-b'
              }`}
            />

            <div className="content-centered">
              <div className="server-announcement-text-overlay">
                <h1 className="server-announcement-title">
                  {teamName}<br />TO SERVE
                </h1>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
