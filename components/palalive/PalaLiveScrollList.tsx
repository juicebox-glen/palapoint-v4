'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

interface PalaLiveScrollListProps {
  children: ReactNode
}

/** Auto-scrolling marquee for player lists that overflow their fixed-height panel. */
export function PalaLiveScrollList({ children }: PalaLiveScrollListProps) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const [scrolling, setScrolling] = useState(false)
  const itemCount = Children.count(children)

  useEffect(() => {
    const viewport = viewportRef.current
    const track = trackRef.current
    if (!viewport || !track) return

    const measure = () => {
      const overflow = track.scrollHeight - viewport.clientHeight
      if (overflow > 4) {
        // Venue glance: players look up mid-point, miss their name, wait briefly.
        // Keep cycles short (~10–20s) so worst-case wait to the far end stays ~4–8s.
        const duration = Math.max(10, Math.min(20, overflow / 20 + 9))
        track.style.setProperty('--palalive-social-scroll', `${overflow}px`)
        track.style.setProperty('--palalive-social-scroll-duration', `${duration}s`)
        setScrolling(true)
      } else {
        track.style.removeProperty('--palalive-social-scroll')
        track.style.removeProperty('--palalive-social-scroll-duration')
        setScrolling(false)
      }
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(track)
    return () => observer.disconnect()
  }, [itemCount])

  return (
    <div className="palalive-player-scroll-viewport" ref={viewportRef}>
      <div className={`palalive-player-scroll-track${scrolling ? ' is-scrolling' : ''}`} ref={trackRef}>
        {children}
      </div>
    </div>
  )
}
