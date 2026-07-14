'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

interface PalaLiveScrollListProps {
  children: ReactNode
}

/** Auto-scrolling marquee for player lists that overflow their fixed-height panel. */
export function PalaLiveScrollList({ children }: PalaLiveScrollListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrolling, setScrolling] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    const measure = () => {
      const overflow = track.scrollHeight - viewport.clientHeight
      if (overflow > 4) {
        const duration = Math.max(18, Math.min(48, overflow / 8 + 18))
        track.style.setProperty('--palalive-social-scroll', `${overflow}px`)
        track.style.setProperty('--palalive-social-scroll-duration', `${duration}s`)
        setScrolling(true)
      } else {
        setScrolling(false)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(track)
    return () => observer.disconnect()
  }, [])

  return (
    <div className="palalive-player-scroll-viewport" ref={viewportRef}>
      <div className={`palalive-player-scroll-track${scrolling ? ' is-scrolling' : ''}`} ref={trackRef}>
        {children}
      </div>
    </div>
  )
}
