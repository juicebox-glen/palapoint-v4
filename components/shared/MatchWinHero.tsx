'use client'

import {
  MatchFinishedScoresSection,
  normalizedSetScoreRows,
  resolveFinishedWinnerSide,
  type MatchFinishedMatch,
} from '@/components/shared/MatchFinishedPanel'
import { formatTeamScoreboard, getPlayerInitials } from '@/lib/utils/name-format'

function winnerWinLine(match: MatchFinishedMatch, winnerTeam: 'a' | 'b'): string {
  const label =
    winnerTeam === 'a'
      ? formatTeamScoreboard(match.team_a_player_1, match.team_a_player_2, 1)
      : formatTeamScoreboard(match.team_b_player_1, match.team_b_player_2, 2)
  return `${label} WIN`
}

function WinnerPhoto({
  photo,
  name,
  team,
}: {
  photo?: string | null
  name?: string | null
  team: 'a' | 'b'
}) {
  const photoClass = team === 'a' ? 'spectator-pregame-photo-a' : 'spectator-pregame-photo-b'

  return (
    <div className={`spectator-pregame-photo-wrap ${photoClass}`}>
      {photo ? (
        <img src={photo} alt="" />
      ) : (
        <span className="spectator-pregame-initials">{getPlayerInitials(name)}</span>
      )}
    </div>
  )
}

/** Full-screen match win hero — winner photos, win line, and scores (court + spectator). */
export function MatchWinHero({ match }: { match: MatchFinishedMatch }) {
  const winnerTeam = resolveFinishedWinnerSide(match)
  if (winnerTeam === null) return null

  const scoreRows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)

  return (
    <div className="match-win-hero">
      <div className="match-win-photos spectator-pregame-photos">
        {winnerTeam === 'a' ? (
          <>
            <WinnerPhoto
              photo={match.team_a_player_1_photo}
              name={match.team_a_player_1}
              team="a"
            />
            <WinnerPhoto
              photo={match.team_a_player_2_photo}
              name={match.team_a_player_2}
              team="a"
            />
          </>
        ) : (
          <>
            <WinnerPhoto
              photo={match.team_b_player_1_photo}
              name={match.team_b_player_1}
              team="b"
            />
            <WinnerPhoto
              photo={match.team_b_player_2_photo}
              name={match.team_b_player_2}
              team="b"
            />
          </>
        )}
      </div>

      <p className="match-win-line">{winnerWinLine(match, winnerTeam)}</p>

      <div className="match-win-scores">
        <MatchFinishedScoresSection
          setsToWin={match.sets_to_win}
          rows={scoreRows}
          winnerSide={winnerTeam}
        />
      </div>
    </div>
  )
}
