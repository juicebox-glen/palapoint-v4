'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'

import {
  COURT_VIEWPORT_HEIGHT,
  COURT_VIEWPORT_WIDTH,
  TV_VIEWPORT_HEIGHT,
  TV_VIEWPORT_WIDTH,
} from '@/lib/display/tv-viewport'

export type TvViewportPreset = 'tv' | 'court'

interface TvViewportCanvasProps {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** Fixed canvas size — used when embedded in the design-system iframe. */
  embed?: boolean
  /** `court` = 2560×1440 (AOC Q32V4). `tv` = 1920×1080 (spectator / lounge). */
  preset?: TvViewportPreset
}

function dimensionsForPreset(preset: TvViewportPreset) {
  if (preset === 'court') {
    return { width: COURT_VIEWPORT_WIDTH, height: COURT_VIEWPORT_HEIGHT }
  }
  return { width: TV_VIEWPORT_WIDTH, height: TV_VIEWPORT_HEIGHT }
}

export function TvViewportCanvas({
  children,
  className,
  style,
  embed = false,
  preset = 'tv',
}: TvViewportCanvasProps) {
  const { width: viewportWidth, height: viewportHeight } = dimensionsForPreset(preset)
  const [fitScale, setFitScale] = useState(1)

  useEffect(() => {
    const rootClass = embed ? 'ds-tv-embed' : 'ds-tv-fit'

    document.documentElement.classList.add(rootClass)
    document.body.classList.add(rootClass)
    document.documentElement.style.setProperty('--ds-tv-embed-width', `${viewportWidth}px`)
    document.documentElement.style.setProperty('--ds-tv-embed-height', `${viewportHeight}px`)

    if (embed) {
      return () => {
        document.documentElement.classList.remove(rootClass)
        document.body.classList.remove(rootClass)
        document.documentElement.style.removeProperty('--ds-tv-embed-width')
        document.documentElement.style.removeProperty('--ds-tv-embed-height')
      }
    }

    const updateScale = () => {
      setFitScale(
        Math.min(
          window.innerWidth / viewportWidth,
          window.innerHeight / viewportHeight,
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
      document.documentElement.style.removeProperty('--ds-tv-embed-width')
      document.documentElement.style.removeProperty('--ds-tv-embed-height')
    }
  }, [embed, viewportWidth, viewportHeight])

  const canvasClass = ['ds-tv-viewport-canvas', className].filter(Boolean).join(' ')

  if (embed) {
    return (
      <div
        className={canvasClass}
        style={{
          width: viewportWidth,
          height: viewportHeight,
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
          width: viewportWidth * fitScale,
          height: viewportHeight * fitScale,
        }}
      >
        <div
          className={canvasClass}
          style={{
            width: viewportWidth,
            height: viewportHeight,
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
