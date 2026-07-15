import type { CSSProperties } from 'react'

import {
  normalizedSetScoreRows,
  resolveFinishedWinnerSide,
} from '@/components/shared/MatchFinishedPanel'
import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import { PalaLiveClock } from '@/components/palalive/PalaLiveClock'
import { PalaLiveShowcaseAmbient } from '@/components/palalive/PalaLiveShowcaseAmbient'
import { PalaLiveShell } from '@/components/palalive/PalaLiveShell'
import { PalaLiveWeatherStub } from '@/components/palalive/PalaLiveWeatherStub'
import { ShowcaseMatchCard } from '@/components/palalive/ShowcaseMatchCard'
import { formatPlayerName, formatTeamScoreboard } from '@/lib/utils/name-format'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'

import '@/app/styles/palalive-showcase.css'

interface PalaLiveShowcaseEndgameViewProps {
  match: MatchState
  branding: VenueBranding | null
  brandingStyles?: CSSProperties
}

/** Post-match hold — PalaLive shell + charcoal final card (no legacy spectator chrome). */
export function PalaLiveShowcaseEndgameView({
  match,
  branding,
  brandingStyles,
}: PalaLiveShowcaseEndgameViewProps) {
  const winnerTeam = resolveFinishedWinnerSide(match)
  const scoreRows = normalizedSetScoreRows(match.set_scores, match.team_a_games, match.team_b_games)

  const winLine =
    winnerTeam === 'a'
      ? `${formatTeamScoreboard(match.team_a_player_1, match.team_a_player_2, 1)} WIN`
      : winnerTeam === 'b'
        ? `${formatTeamScoreboard(match.team_b_player_1, match.team_b_player_2, 2)} WIN`
        : 'MATCH COMPLETE'

  const winnerPlayers =
    winnerTeam === 'a'
      ? [
          { name: match.team_a_player_1, photo: match.team_a_player_1_photo },
          { name: match.team_a_player_2, photo: match.team_a_player_2_photo },
        ]
      : winnerTeam === 'b'
        ? [
            { name: match.team_b_player_1, photo: match.team_b_player_1_photo },
            { name: match.team_b_player_2, photo: match.team_b_player_2_photo },
          ]
        : []

  return (
    <PalaLiveShell
      branding={branding}
      brandingStyles={brandingStyles}
      bottomBarRight={
        <>
          <PalaLiveWeatherStub />
          <PalaLiveClock />
        </>
      }
      mainStage={
        <>
          <PalaLiveShowcaseAmbient />
          <div className="palalive-scoreboard-slot">
            <div className="palalive-showcase-final">
              <span className="palalive-title-label">Match Complete</span>
              {winnerPlayers.length > 0 ? (
                <div className="palalive-showcase-final__avatars">
                  {winnerPlayers.map((p) => {
                    const name = formatPlayerName(p.name, 'full')
                    if (!name) return null
                    return (
                      <PalaLiveAvatar
                        key={name}
                        name={name}
                        photoUrl={p.photo ?? null}
                        className="palalive-showcase-final__avatar"
                      />
                    )
                  })}
                </div>
              ) : null}
              <p className="palalive-showcase-final__win">{winLine}</p>
              <div className="palalive-showcase-final__scores" aria-label="Final set scores">
                {scoreRows.map((row, i) => (
                  <span key={i} className="palalive-showcase-final__set">
                    <span>{row.a}</span>
                    <span className="palalive-showcase-final__hyphen" aria-hidden>
                      –
                    </span>
                    <span>{row.b}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
          <ShowcaseMatchCard match={match} />
        </>
      }
    />
  )
}
