'use client'

import { useEffect, useState } from 'react'

import { KinkFrameCourtBookings } from '@/components/layout/KinkFrameCourtBookings'
import { KinkFrameFeaturePanel } from '@/components/layout/KinkFrameFeaturePanel'
import type { KinkFrameVenueMotion } from '@/components/layout/useKinkFrameVenueTransition'
import {
  KINK_FRAME_CARD_ANIM_MS,
  KINK_FRAME_CARD_STAGGER_MS,
  KINK_FRAME_CONTENT_EXIT_MS,
} from '@/lib/layout/kink-frame-transitions'

const HOLD_MS = 14_000
const BOOKINGS_ENTER_MS = KINK_FRAME_CARD_ANIM_MS + KINK_FRAME_CARD_STAGGER_MS
const FEATURE_ENTER_MS = KINK_FRAME_CARD_ANIM_MS + 155
const GAP_MS = 2_800

type Segment = 'bookings' | 'feature'
type InternalMotion = 'in' | 'hold' | 'out'

export interface KinkFrameCourtAvailabilityProps {
  loop?: boolean
  motion?: KinkFrameVenueMotion
}

/** Idle loop — court bookings, then feature card; respects parent broadcast transitions. */
export function KinkFrameCourtAvailability({ loop = true, motion: parentMotion }: KinkFrameCourtAvailabilityProps) {
  const [cycleKey, setCycleKey] = useState(0)
  const [segment, setSegment] = useState<Segment>('bookings')
  const [internalMotion, setInternalMotion] = useState<InternalMotion>('in')
  const [visible, setVisible] = useState(true)

  const effectiveMotion: InternalMotion =
    parentMotion === 'out'
      ? 'out'
      : parentMotion === 'in'
        ? 'in'
        : internalMotion
  useEffect(() => {
    if (parentMotion === 'in') {
      setSegment('bookings')
      setVisible(true)
      setInternalMotion('in')
    }
    if (parentMotion === 'out') {
      setInternalMotion('out')
    }
  }, [parentMotion])

  useEffect(() => {
    if (!loop || (parentMotion !== undefined && parentMotion !== 'hold')) return

    if (!visible) {
      const gapTimer = window.setTimeout(() => {
        setCycleKey((key) => key + 1)
        setSegment('bookings')
        setInternalMotion('in')
        setVisible(true)
      }, GAP_MS)
      return () => window.clearTimeout(gapTimer)
    }

    if (internalMotion === 'in') {
      const enterMs = segment === 'bookings' ? BOOKINGS_ENTER_MS : FEATURE_ENTER_MS
      const enterTimer = window.setTimeout(() => setInternalMotion('hold'), enterMs)
      return () => window.clearTimeout(enterTimer)
    }

    if (internalMotion === 'hold') {
      const holdTimer = window.setTimeout(() => setInternalMotion('out'), HOLD_MS)
      return () => window.clearTimeout(holdTimer)
    }

    const exitTimer = window.setTimeout(() => {
      if (segment === 'bookings') {
        setSegment('feature')
        setInternalMotion('in')
        return
      }
      setVisible(false)
    }, KINK_FRAME_CONTENT_EXIT_MS)

    return () => window.clearTimeout(exitTimer)
  }, [cycleKey, internalMotion, loop, parentMotion, segment, visible])

  if (!visible && parentMotion === undefined) return null

  return (
    <div
      key={cycleKey}
      className={[
        'kink-frame-courts-broadcast',
        'kink-frame-courts-broadcast--on-air',
        effectiveMotion === 'out'
          ? 'kink-frame-courts-broadcast--out'
          : effectiveMotion === 'hold'
            ? 'kink-frame-courts-broadcast--hold'
            : 'kink-frame-courts-broadcast--in',
      ].join(' ')}
    >
      <div key={segment} className="kink-frame-courts">
        {segment === 'bookings' ? <KinkFrameCourtBookings /> : <KinkFrameFeaturePanel />}
      </div>
    </div>
  )
}
