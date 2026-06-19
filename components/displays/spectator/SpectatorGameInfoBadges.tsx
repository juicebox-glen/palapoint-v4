import type { MatchState } from '@/lib/types/match'

import { pregameModeLabel, pregameSetsLabel } from './utils'

/** Bottom-left sets + mode pills — shared across pregame, live, and endgame. */
export function SpectatorGameInfoBadges({ match }: { match: MatchState }) {
  return (
    <div className="spectator-header-badges spectator-pregame-badges">
      <div className="spectator-court-badge">{pregameSetsLabel(match.sets_to_win)}</div>
      <div className="spectator-court-badge">{pregameModeLabel(match.game_mode)}</div>
    </div>
  )
}
