'use client'

import type { CSSProperties } from 'react'
import { useEffect, useRef, useState } from 'react'

import {
  KINK_FRAME_V2_OVERLAY_PATH,
  KINK_FRAME_V2_SKELETON_COLORS,
  KINK_FRAME_V2_VIEWBOX,
  kinkFrameV2ContentMaskUrl,
} from '@/lib/layout/kink-frame-v2-geometry'

import '@/app/styles/kink-frame.css'

export interface KinkFrameSkeletonDisplayProps {
  /** Preview with toolbar + matte, or full-bleed TV output. */
  variant?: 'preview' | 'device'
  showMatte?: boolean
  /** Overlay the reference mockup at 50% opacity for pixel checks. */
  showMockupOverlay?: boolean
  className?: string
  style?: CSSProperties
}

/** Skeleton-only kink frame v2 — content area + frame overlay, no widgets or panels. */
export function KinkFrameSkeletonDisplay({
  variant = 'preview',
  showMatte,
  showMockupOverlay = false,
  className,
  style,
}: KinkFrameSkeletonDisplayProps) {
  const isDevice = variant === 'device'
  const matte = showMatte ?? !isDevice
  const showToolbar = !isDevice
  const { width, height } = KINK_FRAME_V2_VIEWBOX
  const contentMask = kinkFrameV2ContentMaskUrl()
  const stageRef = useRef<HTMLDivElement>(null)
  const [overlayOn, setOverlayOn] = useState(showMockupOverlay)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const syncScale = () => {
      const scale = stage.clientWidth / width
      stage.style.setProperty('--kink-scale', scale.toFixed(5))
    }

    syncScale()
    const observer = new ResizeObserver(syncScale)
    observer.observe(stage)
    return () => observer.disconnect()
  }, [width])

  return (
    <div
      className={[
        'kink-frame-root',
        'kink-frame-root--skeleton',
        isDevice ? 'kink-frame-root--device' : '',
        matte ? 'kink-frame-root--matte' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="kink-frame-shell">
        {showToolbar ? (
          <div className="kink-frame-skeleton-toolbar">
            <label className="kink-frame-skeleton-toggle">
              <input
                type="checkbox"
                checked={overlayOn}
                onChange={(event) => setOverlayOn(event.target.checked)}
              />
              Mockup overlay
            </label>
            <span className="kink-frame-skeleton-spec">
              1920×1080 · 20px border · 140px kink
            </span>
            <a href="/kink-frame/skeleton/display" className="kink-frame-skeleton-device-link">
              Open TV display →
            </a>
          </div>
        ) : null}

        <div
          ref={stageRef}
          className="kink-frame-stage kink-frame-stage--skeleton-v2"
          style={isDevice ? { width: '100%', height: '100%' } : { aspectRatio: `${width} / ${height}` }}
        >
          <div
            className="kink-frame-media kink-frame-media--skeleton-v2"
            style={{
              WebkitMaskImage: contentMask,
              maskImage: contentMask,
            }}
          />

          <svg
            className="kink-frame-overlay"
            aria-hidden
            viewBox={`0 0 ${width} ${height}`}
            preserveAspectRatio="none"
          >
            <path
              d={KINK_FRAME_V2_OVERLAY_PATH}
              fill={KINK_FRAME_V2_SKELETON_COLORS.frame}
              fillRule="evenodd"
            />
          </svg>

          {overlayOn ? (
            <img
              className="kink-frame-skeleton-mockup"
              src="/design/kink-frame-v2-mockup.png"
              alt=""
              aria-hidden
            />
          ) : null}
        </div>
      </div>
    </div>
  )
}
