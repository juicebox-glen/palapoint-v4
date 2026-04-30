'use client'

import { ScoreSepBar } from '@/components/ui/ScoreSepBar'
import type { MatchState } from '@/lib/types/match'
import { formatPointDisplay } from '@/lib/utils/score-format'
import { getPointSituation } from '@/lib/utils/point-situation'
import { getTeamDisplayName } from '@/lib/utils/player-names'

export interface ControlScoreboardProps {
  match: MatchState
}

/** Same markup/classes as staff control in-game — shared with player `/playing`. */
export default function ControlScoreboard({ match }: ControlScoreboardProps) {
  const teamAName = getTeamDisplayName([match.team_a_player_1, match.team_a_player_2], 1)
  const teamBName = getTeamDisplayName([match.team_b_player_1, match.team_b_player_2], 2)
  const pointsA = formatPointDisplay(
    match.team_a_points,
    match.team_b_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_a : undefined
  )
  const pointsB = formatPointDisplay(
    match.team_b_points,
    match.team_a_points,
    match.is_tiebreak,
    match.is_tiebreak ? match.tiebreak_scores?.team_b : undefined
  )
  const matchSetsToWin = match.sets_to_win ?? 1
  const setsWonA = (match.set_scores ?? []).filter((s) => s.team_a > s.team_b).length
  const setsWonB = (match.set_scores ?? []).filter((s) => s.team_b > s.team_a).length
  const pointSituation = getPointSituation(match)

  return (
    <div className="control-scoreboard">
      <div className="control-scoreboard-cols">
        <div className="control-scoreboard-col">
          {match.serving_team === 'a' && (
            <div className="control-server-bar control-server-bar-a" aria-hidden />
          )}
          <div className="control-scoreboard-name">{teamAName}</div>
          <div className="control-scoreboard-point">{pointsA}</div>
        </div>
        <div className="control-scoreboard-col">
          {match.serving_team === 'b' && (
            <div className="control-server-bar control-server-bar-b" aria-hidden />
          )}
          <div className="control-scoreboard-name">{teamBName}</div>
          <div className="control-scoreboard-point">{pointsB}</div>
        </div>
      </div>
      <div className="control-scoreboard-sets-row">
        <div className="control-scoreboard-sets">
          {Array.from({ length: matchSetsToWin }).map((_, i) => (
            <span
              key={i}
              className={`control-scoreboard-set-dot team-a ${i < setsWonA ? 'won' : ''}`}
              aria-hidden
            />
          ))}
        </div>
        <div className="control-scoreboard-games">
          <span>{match.team_a_games}</span>
          <ScoreSepBar className="control-scoreboard-games-sep" />
          <span>{match.team_b_games}</span>
        </div>
        <div className="control-scoreboard-sets">
          {Array.from({ length: matchSetsToWin }).map((_, i) => (
            <span
              key={i}
              className={`control-scoreboard-set-dot team-b ${i < setsWonB ? 'won' : ''}`}
              aria-hidden
            />
          ))}
        </div>
      </div>
      {match.is_tiebreak && (
        <div className="control-scoreboard-tiebreak">Tiebreak</div>
      )}
      {pointSituation && (
        <div className="control-point-badge">{pointSituation.type}</div>
      )}
    </div>
  )
}
