'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

import {
  TV_VIEWPORT_HEIGHT,
  TV_VIEWPORT_WIDTH,
} from '@/lib/display/tv-viewport'

interface TvViewportCanvasProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Fixed 1920×1080 — used when embedded in the design-system iframe. */
  embed?: boolean
}

export function TvViewportCanvas({
  children,
  className,
  style,
  embed = false,
}: TvViewportCanvasProps) {
  const [fitScale, setFitScale] = useState(1)

  useEffect(() => {
    const rootClass = embed ? 'ds-tv-embed' : 'ds-tv-fit'

    document.documentElement.classList.add(rootClass)
    document.body.classList.add(rootClass)

    if (embed) {
      return () => {
        document.documentElement.classList.remove(rootClass)
        document.body.classList.remove(rootClass)
      }
    }

    const updateScale = () => {
      setFitScale(
        Math.min(
          window.innerWidth / TV_VIEWPORT_WIDTH,
          window.innerHeight / TV_VIEWPORT_HEIGHT,
          1
        )
      )
    }

    updateScale()
    window.addEventListener('resize', updateScale)

    return () => {
      window.removeEventListener('resize', updateScale)
      document.documentElement.classList.remove(rootClass)
      document.body.classList.remove(rootClass)
    }
  }, [embed])

  const canvasClass = ['ds-tv-viewport-canvas', className].filter(Boolean).join(' ')

  if (embed) {
    return (
      <div
        className={canvasClass}
        style={{
          width: TV_VIEWPORT_WIDTH,
          height: TV_VIEWPORT_HEIGHT,
          ...style,
        }}
      >
        {children}
      </div>
    )
  }

  return (
    <div className="ds-tv-viewport-fit-root">
      <div
        className="ds-tv-viewport-fit-scaler"
        style={{
          width: TV_VIEWPORT_WIDTH * fitScale,
          height: TV_VIEWPORT_HEIGHT * fitScale,
        }}
      >
        <div
          className={canvasClass}
          style={{
            width: TV_VIEWPORT_WIDTH,
            height: TV_VIEWPORT_HEIGHT,
            transform: `scale(${fitScale})`,
            transformOrigin: 'top left',
            ...style,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
