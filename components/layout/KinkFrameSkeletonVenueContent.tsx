'use client'

import { KinkFrameContentPanel } from '@/components/layout/KinkFrameContentPanel'
import { KinkFrameCourtAvailability } from '@/components/layout/KinkFrameCourtAvailability'
import { KinkFrameLeftContentPanel } from '@/components/layout/KinkFrameLeftContentPanel'
import { KinkFrameSkeletonSocialLeftPanel } from '@/components/layout/KinkFrameSkeletonSocialLeftPanel'
import { KinkFrameSocialPlayersList } from '@/components/layout/KinkFrameSocialPlayersList'
import type { KinkFrameVenueMode } from '@/lib/layout/kink-frame-venue-mode'

export interface KinkFrameSkeletonVenueContentProps {
  mode?: KinkFrameVenueMode
}

/** Skeleton v2 — idle bookings (right), social fixtures (left) + players (right). */
export function KinkFrameSkeletonVenueContent({ mode = 'idle' }: KinkFrameSkeletonVenueContentProps) {
  if (mode === 'social') {
    return (
      <>
        <KinkFrameLeftContentPanel className="kink-frame-left-content-panel--skeleton-v2">
          <KinkFrameSkeletonSocialLeftPanel />
        </KinkFrameLeftContentPanel>

        <KinkFrameContentPanel className="kink-frame-content-panel--skeleton-v2">
          <KinkFrameSocialPlayersList />
        </KinkFrameContentPanel>
      </>
    )
  }

  return (
    <KinkFrameContentPanel className="kink-frame-content-panel--skeleton-v2">
      <KinkFrameCourtAvailability loop />
    </KinkFrameContentPanel>
  )
}
