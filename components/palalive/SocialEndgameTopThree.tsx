import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import type { SocialNightPlayer } from '@/lib/palalive/social-types'

interface SocialEndgameTopThreeProps {
  eventName: string
  standings: SocialNightPlayer[]
}

const PLACE_CLASS = ['is-first', 'is-second', 'is-third'] as const
const PLACE_LABEL = ['1st', '2nd', '3rd'] as const

export function SocialEndgameTopThree({ eventName, standings }: SocialEndgameTopThreeProps) {
  const topThree = standings.slice(0, 3)
  // Full podium reads 2nd · 1st · 3rd; short lists stay in rank order.
  const podiumOrder =
    topThree.length === 3 ? [topThree[1], topThree[0], topThree[2]] : topThree

  return (
    <div className="palalive-social-endgame">
      <div className="palalive-event-header">
        <span className="palalive-event-title">{eventName}</span>
        <span className="palalive-event-round">Final</span>
      </div>

      <div className={`palalive-social-podium palalive-social-podium--count-${topThree.length}`}>
        {podiumOrder.length === 0 ? (
          <p className="palalive-social-podium-empty">No standings yet.</p>
        ) : (
          podiumOrder.map((player, index) => {
            const placeIndex = Math.min(
              Math.max((player.rank || index + 1) - 1, 0),
              2
            )
            return (
              <div
                key={player.id}
                className={`palalive-social-podium-card ${PLACE_CLASS[placeIndex]}`}
              >
                <span className="palalive-social-podium-place">{PLACE_LABEL[placeIndex]}</span>
                <PalaLiveAvatar name={player.name} photoUrl={player.photoUrl} />
                <span className="palalive-social-podium-name">{player.name}</span>
                <span className="palalive-social-podium-pts">{player.totalPoints} pts</span>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
