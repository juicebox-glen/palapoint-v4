import type { SetupDisplayPreviewConfig } from '@/components/displays/SetupDisplay'

export function getSetupPreviewConfig(state: string): SetupDisplayPreviewConfig {
  switch (state) {
    case 'review':
      return { screen: 'review' }
    case 'form':
    default:
      return { screen: 'form' }
  }
}
