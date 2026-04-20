import type { SetupDisplayPreviewConfig } from '@/components/displays/SetupDisplay'

/** Maps `?state=` on the design-system setup preview route. */
export function getSetupPreviewConfig(state: string): SetupDisplayPreviewConfig {
  switch (state) {
    case 'review':
      return { screen: 'review' }
    case 'confirmation':
      return { screen: 'confirmation' }
    case 'match_join':
      return { screen: 'match_join_prompt' }
    case 'session_prompt':
      return { screen: 'session_prompt' }
    case 'form':
    default:
      return { screen: 'form' }
  }
}
