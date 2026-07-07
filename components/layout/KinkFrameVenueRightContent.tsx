'use client'

import { KinkFrameCourtAvailability } from '@/components/layout/KinkFrameCourtAvailability'
import { KinkFrameGlassPanel } from '@/components/layout/KinkFrameGlassPanel'
import { KinkFrameShowcaseRightPanel } from '@/components/layout/KinkFrameShowcasePanel'
import { KinkFrameSocialRightPanel } from '@/components/layout/KinkFrameSocialRightPanel'
import type { KinkFrameVenueMotion } from '@/components/layout/useKinkFrameVenueTransition'
import {
  kinkFrameModeIsSocialLayout,
  kinkFrameModePanelKey,
  type KinkFrameVenueMode,
} from '@/lib/layout/kink-frame-venue-mode'

export interface KinkFrameVenueRightContentProps {
  contentMode: KinkFrameVenueMode
  motion: KinkFrameVenueMotion
}

/** Right venue column — court availability loop on idle, glass panel for showcase/social. */
export function KinkFrameVenueRightContent({ contentMode, motion }: KinkFrameVenueRightContentProps) {
  if (contentMode === 'idle') {
    return <KinkFrameCourtAvailability motion={motion} loop={motion === 'hold'} />
  }

  return (
    <KinkFrameGlassPanel panelKey={kinkFrameModePanelKey(contentMode)} motion={motion}>
      {contentMode === 'showcase' ? <KinkFrameShowcaseRightPanel /> : null}
      {kinkFrameModeIsSocialLayout(contentMode) ? <KinkFrameSocialRightPanel /> : null}
    </KinkFrameGlassPanel>
  )
}
