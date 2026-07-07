'use client'

import { KinkFrameModeLeftShell } from '@/components/layout/KinkFrameModeLeftShell'
import { KinkFrameShowcaseLeftPanel } from '@/components/layout/KinkFrameShowcasePanel'
import { KinkFrameSocialLeftPanel } from '@/components/layout/KinkFrameSocialLeftPanel'
import type { KinkFrameVenueMotion } from '@/components/layout/useKinkFrameVenueTransition'
import {
  kinkFrameModeIsSocialLayout,
  kinkFrameModePanelKey,
  type KinkFrameVenueMode,
} from '@/lib/layout/kink-frame-venue-mode'

export interface KinkFrameVenueLeftContentProps {
  contentMode: KinkFrameVenueMode
  motion: KinkFrameVenueMotion
}

/** Left venue column — showcase and social only (idle uses right panel only). */
export function KinkFrameVenueLeftContent({ contentMode, motion }: KinkFrameVenueLeftContentProps) {
  if (contentMode === 'idle') return null

  return (
    <KinkFrameModeLeftShell panelKey={`${kinkFrameModePanelKey(contentMode)}-left`} motion={motion}>
      {contentMode === 'showcase' ? <KinkFrameShowcaseLeftPanel /> : null}
      {kinkFrameModeIsSocialLayout(contentMode) ? <KinkFrameSocialLeftPanel /> : null}
    </KinkFrameModeLeftShell>
  )
}
