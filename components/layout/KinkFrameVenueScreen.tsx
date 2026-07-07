'use client'

import { useState } from 'react'

import { KinkFrameDisplay } from '@/components/layout/KinkFrameDisplay'
import { KinkFrameLeftContentPanel } from '@/components/layout/KinkFrameLeftContentPanel'
import { KinkFrameMediaBackdrops } from '@/components/layout/KinkFrameMediaBackdrops'
import { KinkFrameModeNav } from '@/components/layout/KinkFrameModeNav'
import { KinkFrameVenueLeftContent } from '@/components/layout/KinkFrameVenueLeftContent'
import { KinkFrameVenueRightContent } from '@/components/layout/KinkFrameVenueRightContent'
import { useKinkFrameVenueTransition } from '@/components/layout/useKinkFrameVenueTransition'
import {
  kinkFrameModeUsesFlatShell,
  type KinkFrameVenueMode,
} from '@/lib/layout/kink-frame-venue-mode'

export interface KinkFrameVenueScreenProps {
  showMatte?: boolean
  showClock?: boolean
}

/** Full kink-frame venue display — idle + Showcase + Social (+ flat social variant). */
export function KinkFrameVenueScreen({ showMatte = true, showClock = true }: KinkFrameVenueScreenProps) {
  const [mode, setMode] = useState<KinkFrameVenueMode>('idle')
  const { bgMode, contentMode, motion, bgTransitioning } = useKinkFrameVenueTransition(mode)
  const navDisabled = motion !== 'hold' || bgTransitioning
  const showLeftPanel = mode !== 'idle'

  return (
    <KinkFrameDisplay
      showMatte={showMatte}
      showClock={showClock}
      shell={kinkFrameModeUsesFlatShell(mode) ? 'flat' : 'kink'}
      onLogoClick={() => setMode('idle')}
      topNav={<KinkFrameModeNav mode={mode} onModeChange={setMode} disabled={navDisabled} />}
      media={<KinkFrameMediaBackdrops mode={bgMode} transitioning={bgTransitioning} />}
      leftContentPanel={
        showLeftPanel ? (
          <KinkFrameLeftContentPanel>
            <KinkFrameVenueLeftContent contentMode={contentMode} motion={motion} />
          </KinkFrameLeftContentPanel>
        ) : null
      }
      contentPanel={<KinkFrameVenueRightContent contentMode={contentMode} motion={motion} />}
    />
  )
}
