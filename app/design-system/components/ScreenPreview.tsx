'use client'

import { useState } from 'react'

interface ScreenPreviewProps {
  title: string
  description: string
  viewport: 'mobile' | 'tablet' | 'tv'
  states: {
    name: string
    label: string
    url: string
  }[]
}

const viewportSizes = {
  mobile: { width: 375, height: 667, scale: 1 },
  tablet: { width: 768, height: 1024, scale: 0.6 },
  tv: { width: 1920, height: 1080, scale: 0.35 },
}

export function ScreenPreview({ title, description, viewport, states }: ScreenPreviewProps) {
  const [activeState, setActiveState] = useState(states[0]?.name || '')
  const size = viewportSizes[viewport]

  const activeUrl = states.find((s) => s.name === activeState)?.url || ''

  return (
    <div className="ds-screen-preview">
      <div className="ds-screen-header">
        <div>
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="ds-screen-meta">
          <span className="ds-viewport-label">{viewport.toUpperCase()}</span>
          <span className="ds-viewport-size">
            {size.width} × {size.height}
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
        className="ds-screen-frame"
        style={{
          width: size.width * size.scale,
          height: size.height * size.scale,
        }}
      >
        <iframe
          src={activeUrl}
          title={`${title} - ${activeState}`}
          style={{
            width: size.width,
            height: size.height,
            transform: `scale(${size.scale})`,
            transformOrigin: 'top left',
            border: 'none',
          }}
        />
      </div>

      <div className="ds-screen-actions">
        <a href={activeUrl} target="_blank" rel="noopener noreferrer" className="ds-open-link">
          Open in new tab ↗
        </a>
      </div>
    </div>
  )
}
