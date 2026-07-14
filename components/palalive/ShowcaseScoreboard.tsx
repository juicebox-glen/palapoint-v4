import { countSetsWonByTeam, formatLivePointDisplay, spectatorSetDotCount } from '@/components/displays/spectator/utils'
import type { MatchState } from '@/lib/types/match'

interface ShowcaseScoreboardProps {
  match: MatchState
}

function TeamPanel({
  label,
  points,
  setDotCount,
  setsWon,
  isServing,
}: {
  label: string
  points: string
  setDotCount: number
  setsWon: number
  isServing: boolean
}) {
  return (
    <div className={`palalive-scoreboard-team${isServing ? ' is-serving' : ''}`}>
      <span className="palalive-team-label">{label}</span>
      <span className="palalive-team-score">{points}</span>
      <div className="palalive-team-sets" aria-hidden>
        {Array.from({ length: setDotCount }).map((_, i) => (
          <span key={i} className={`palalive-set-dot${setsWon > i ? ' is-won' : ''}`} />
        ))}
      </div>
    </div>
  )
}

export function ShowcaseScoreboard({ match }: ShowcaseScoreboardProps) {
  const setDotCount = spectatorSetDotCount(match.sets_to_win ?? 1)
  const setsWonA = countSetsWonByTeam(match.set_scores, 'a')
  const setsWonB = countSetsWonByTeam(match.set_scores, 'b')

  return (
    <div className="palalive-scoreboard">
      <TeamPanel
        label="Team 1"
        points={formatLivePointDisplay('a', match)}
        setDotCount={setDotCount}
        setsWon={setsWonA}
        isServing={match.serving_team === 'a'}
      />
      <TeamPanel
        label="Team 2"
        points={formatLivePointDisplay('b', match)}
        setDotCount={setDotCount}
        setsWon={setsWonB}
        isServing={match.serving_team === 'b'}
      />
      <div className="palalive-scoreboard-games">
        <span className="palalive-games-count">{match.team_a_games ?? 0}</span>
        <span className="palalive-games-dash">-</span>
        <span className="palalive-games-count">{match.team_b_games ?? 0}</span>
      </div>
    </div>
  )
}
