'use client'

import { useEffect, useRef, useState } from 'react'

import {
  COURT_VIEWPORT_HEIGHT,
  COURT_VIEWPORT_WIDTH,
  TV_VIEWPORT_HEIGHT,
  TV_VIEWPORT_WIDTH,
} from '@/lib/display/tv-viewport'

export interface ScreenPreviewState {
  name: string
  label: string
  url: string
  /** When set, overrides the default `viewport` for this tab only (e.g. TV for venue “show”). */
  viewport?: 'mobile' | 'tablet' | 'tv' | 'court'
}

interface ScreenPreviewProps {
  title: string
  description: string
  viewport: 'mobile' | 'tablet' | 'tv' | 'court'
  states: ScreenPreviewState[]
}

const viewportSizes = {
  mobile: { width: 375, height: 667, scale: 1 },
  tablet: { width: 768, height: 1024, scale: 0.6 },
  tv: { width: TV_VIEWPORT_WIDTH, height: TV_VIEWPORT_HEIGHT, scale: 1 },
  court: { width: COURT_VIEWPORT_WIDTH, height: COURT_VIEWPORT_HEIGHT, scale: 1 },
} as const

function withEmbedParam(url: string): string {
  const separator = url.includes('?') ? '&' : '?'
  return `${url}${separator}embed=1`
}

export function ScreenPreview({ title, description, viewport, states }: ScreenPreviewProps) {
  const [activeState, setActiveState] = useState(states[0]?.name || '')
  const frameRef = useRef<HTMLDivElement>(null)
  const [frameScale, setFrameScale] = useState(1)

  const active = states.find((s) => s.name === activeState) ?? states[0]
  const effectiveViewport = active?.viewport ?? viewport
  const size = viewportSizes[effectiveViewport]
  const activeUrl = active?.url ?? ''
  const iframeSrc = withEmbedParam(activeUrl)

  useEffect(() => {
    if (effectiveViewport !== 'tv' && effectiveViewport !== 'court') return

    const frame = frameRef.current
    if (!frame) return

    const updateScale = () => {
      const width = frame.clientWidth
      if (width <= 0) return
      setFrameScale(Math.min(width / size.width, 1))
    }

    updateScale()
    const observer = new ResizeObserver(updateScale)
    observer.observe(frame)
    return () => observer.disconnect()
  }, [effectiveViewport, iframeSrc, size.width])

  const displayScale =
    effectiveViewport === 'tv' || effectiveViewport === 'court'
      ? frameScale
      : size.scale
  const frameWidth = size.width * displayScale
  const frameHeight = size.height * displayScale

  return (
    <div className="ds-screen-preview">
      <div className="ds-screen-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
          {effectiveViewport === 'tv' || effectiveViewport === 'court' ? (
            <p className="ds-screen-note">
              Preview renders at {size.width}×{size.height}
              {effectiveViewport === 'court'
                ? ' (AOC Q32V4 — on-court monitor). Open in a new tab on that display for a 1:1 pixel preview.'
                : ' (1080p lounge TV). Scale below is for this page only — proportions match production.'}
            </p>
          ) : null}
        </div>
        <div className="ds-screen-meta">
          <span className="ds-viewport-label">{effectiveViewport.toUpperCase()}</span>
          <span className="ds-viewport-size">
            {size.width} × {size.height}
            {effectiveViewport === 'tv' || effectiveViewport === 'court' ? ` · ${Math.round(displayScale * 100)}%` : null}
          </span>
        </div>
      </div>

      {states.length > 1 && (
        <div className="ds-state-switcher">
          {states.map((state) => (
            <button
              key={state.name}
              type="button"
              className={`ds-state-btn ${activeState === state.name ? 'ds-state-btn--active' : ''}`}
              onClick={() => setActiveState(state.name)}
            >
              {state.label}
            </button>
          ))}
        </div>
      )}

      <div
        ref={frameRef}
        className="ds-screen-frame"
        style={{
          width: '100%',
          height: frameHeight,
        }}
      >
        <iframe
          key={`${iframeSrc}-${effectiveViewport}`}
          src={iframeSrc}
          title={`${title} - ${activeState}`}
          style={{
            width: size.width,
            height: size.height,
            transform: `scale(${displayScale})`,
            transformOrigin: 'top left',
            border: 'none',
          }}
        />
      </div>

      <div className="ds-screen-actions">
        <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="ds-open-link">
          Open at TV size ↗
        </a>
      </div>
    </div>
  )
}
