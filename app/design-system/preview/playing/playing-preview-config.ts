import type { PlayingDisplayPreviewConfig } from '@/components/displays/PlayingDisplay'

/** Maps `?state=` on the design-system playing preview route. */
export function getPlayingPreviewConfig(state: string): PlayingDisplayPreviewConfig {
  switch (state) {
    case 'no_session':
      return { screen: 'no_session' }
    case 'session_ended':
      return { screen: 'session_ended' }
    case 'session_ended_inactivity':
      return { screen: 'session_ended_inactivity' }
    case 'ready':
      return { screen: 'ready' }
    case 'postgame_win':
      return { screen: 'postgame_win' }
    case 'postgame_win_3sweep':
      return { screen: 'postgame_win_3sweep' }
    case 'postgame_win_3split':
      return { screen: 'postgame_win_3split' }
    case 'postgame_abandoned':
      return { screen: 'postgame_abandoned' }
    case 'live':
    default:
      return { screen: 'live' }
  }
}
