'use client'

import type { CSSProperties, ReactNode } from 'react'
import { useEffect, useRef } from 'react'

import { KinkFrameClock, type KinkFrameClockProps } from '@/components/layout/KinkFrameClock'
import { KinkFrameContentPanel } from '@/components/layout/KinkFrameContentPanel'
import { KinkFrameLogo } from '@/components/layout/KinkFrameLogo'
import {
  KINK_FRAME_COLORS,
  KINK_FRAME_OVERLAY_PATH,
  KINK_FRAME_VIEWBOX,
  kinkFrameContentMaskUrl,
} from '@/lib/layout/kink-frame-geometry'

import '@/app/styles/kink-frame.css'

export interface KinkFrameDisplayProps {
  children?: ReactNode
  /** Full-bleed media layers inside the frame mask (video / mode backgrounds). */
  media?: ReactNode
  /** Optional matte around the 1920×1080 stage (preview / design-system). */
  showMatte?: boolean
  /** Clock + weather chip in the bottom-right frame pocket. */
  showClock?: boolean
  clock?: KinkFrameClockProps
  /** Square One logo in the top-left frame pocket. */
  showLogo?: boolean
  /** Click logo to return to idle (venue screen demo). */
  onLogoClick?: () => void
  /** Horizontal mode links along the top of the stage. */
  topNav?: ReactNode
  /** Kink frame overlay (default) or full 16:9 flat canvas. */
  shell?: 'kink' | 'flat'
  /** Glass panel over the right side of the media area. */
  contentPanel?: ReactNode
  /** Optional overlay on the left side of the media area (e.g. social game info). */
  leftContentPanel?: ReactNode
  className?: string
  style?: CSSProperties
}

/**
 * 1920×1080 (16:9) display shell — full-bleed media masked to the inner shape, black
 * frame (with bottom-right kink) composited on top.
 */
export function KinkFrameDisplay({
  children,
  media,
  showMatte = false,
  showClock = false,
  clock,
  showLogo = true,
  onLogoClick,
  topNav,
  shell = 'kink',
  contentPanel,
  leftContentPanel,
  className,
  style,
}: KinkFrameDisplayProps) {
  const { width, height } = KINK_FRAME_VIEWBOX
  const useKinkShell = shell === 'kink'
  const contentMask = useKinkShell ? kinkFrameContentMaskUrl() : undefined
  const stageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const syncScale = () => {
      const scale = stage.clientWidth / width
      const next = scale.toFixed(5)
      if (stage.style.getPropertyValue('--kink-scale') === next) return
      stage.style.setProperty('--kink-scale', next)
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
        showMatte ? 'kink-frame-root--matte' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className="kink-frame-shell">
        {topNav ? <div className="kink-frame-top-nav-slot">{topNav}</div> : null}
        <div
          ref={stageRef}
          className={['kink-frame-stage', useKinkShell ? '' : 'kink-frame-stage--flat']
            .filter(Boolean)
            .join(' ')}
          style={{ aspectRatio: `${width} / ${height}` }}
        >
          {!useKinkShell && showClock ? (
            <header className="kink-frame-flat-top-bar" aria-label="Venue header">
              <KinkFrameClock {...clock} />
            </header>
          ) : null}

          <div
            className="kink-frame-media"
            style={
              contentMask
                ? {
                    WebkitMaskImage: contentMask,
                    maskImage: contentMask,
                  }
                : undefined
            }
          >
            {media ?? children ?? <div className="kink-frame-media-placeholder" aria-hidden />}
            {showLogo ? <div className="kink-frame-logo-scrim" aria-hidden /> : null}
            {useKinkShell ? <div className="kink-frame-notch-scrim" aria-hidden /> : null}
            {leftContentPanel ? leftContentPanel : null}
            {contentPanel ? <KinkFrameContentPanel>{contentPanel}</KinkFrameContentPanel> : null}
          </div>

          {useKinkShell ? (
            <svg
              className="kink-frame-overlay"
              aria-hidden
              viewBox={`0 0 ${width} ${height}`}
              preserveAspectRatio="none"
            >
              <path
                d={KINK_FRAME_OVERLAY_PATH}
                fill={KINK_FRAME_COLORS.frame}
                fillRule="evenodd"
              />
            </svg>
          ) : null}

          {useKinkShell && showLogo ? <KinkFrameLogo onClick={onLogoClick} /> : null}
          {useKinkShell && showClock ? <KinkFrameClock {...clock} /> : null}
          {!useKinkShell && showLogo ? (
            <div className="kink-frame-flat-logo">
              <KinkFrameLogo onClick={onLogoClick} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
