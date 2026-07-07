'use client'

import { useEffect, useRef, useState } from 'react'

import {
  KINK_FRAME_BG_CROSSFADE_LEAD_MS,
  KINK_FRAME_BG_CROSSFADE_MS,
  KINK_FRAME_CONTENT_EXIT_MS,
  KINK_FRAME_MODE_ENTER_MS,
  kinkFrameModesShareBackground,
  kinkFrameModesShareContent,
} from '@/lib/layout/kink-frame-transitions'
import type { KinkFrameVenueMode } from '@/lib/layout/kink-frame-venue-mode'

export type KinkFrameVenueMotion = 'in' | 'hold' | 'out'

export interface KinkFrameVenueTransitionState {
  bgMode: KinkFrameVenueMode
  contentMode: KinkFrameVenueMode
  motion: KinkFrameVenueMotion
  bgTransitioning: boolean
}

/** Sequenced mode changes — content out → bg crossfade → content in. */
export function useKinkFrameVenueTransition(requestedMode: KinkFrameVenueMode): KinkFrameVenueTransitionState {
  const [bgMode, setBgMode] = useState(requestedMode)
  const [contentMode, setContentMode] = useState(requestedMode)
  const [motion, setMotion] = useState<KinkFrameVenueMotion>('in')
  const [bgTransitioning, setBgTransitioning] = useState(false)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach((id) => window.clearTimeout(id))
    timersRef.current = []
  }

  const schedule = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms)
    timersRef.current.push(id)
  }

  useEffect(() => {
    clearTimers()

    if (requestedMode === contentMode && motion === 'in') {
      schedule(() => setMotion('hold'), KINK_FRAME_MODE_ENTER_MS)
      return () => clearTimers()
    }

    if (requestedMode === contentMode) {
      return undefined
    }

    if (kinkFrameModesShareContent(contentMode, requestedMode)) {
      setContentMode(requestedMode)
      setBgMode(requestedMode)
      setMotion('hold')
      setBgTransitioning(false)
      return undefined
    }

    setMotion('out')
    setBgTransitioning(false)

    const sameBackground = kinkFrameModesShareBackground(contentMode, requestedMode)
    const bgSwapAt = Math.max(0, KINK_FRAME_CONTENT_EXIT_MS - KINK_FRAME_BG_CROSSFADE_LEAD_MS)

    if (!sameBackground) {
      schedule(() => {
        setBgTransitioning(true)
        setBgMode(requestedMode)
      }, bgSwapAt)

      schedule(() => {
        setBgTransitioning(false)
      }, KINK_FRAME_CONTENT_EXIT_MS + KINK_FRAME_BG_CROSSFADE_MS)
    }

    schedule(() => {
      setContentMode(requestedMode)
      if (sameBackground) {
        setBgMode(requestedMode)
      }
      setMotion('in')
    }, KINK_FRAME_CONTENT_EXIT_MS)

    schedule(
      () => setMotion('hold'),
      KINK_FRAME_CONTENT_EXIT_MS + KINK_FRAME_MODE_ENTER_MS,
    )

    return () => clearTimers()
  }, [requestedMode]) // eslint-disable-line react-hooks/exhaustive-deps

  return { bgMode, contentMode, motion, bgTransitioning }
}
