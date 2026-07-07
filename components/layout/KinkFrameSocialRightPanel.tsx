import { KINK_FRAME_SOCIAL_STANDINGS, type KinkFrameSocialStanding } from '@/lib/layout/kink-frame-social-data'
import { KinkFrameModePanel } from '@/components/layout/KinkFrameModePanel'
import { formatPlayerName, getPlayerInitials } from '@/lib/utils/name-format'

const PODIUM_SIZE = 3

function formatStandingPoints(points: number): string {
  return points > 0 ? `+${points}` : `${points}`
}

function StandingPhoto({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  return (
    <div className="kink-frame-social-lb-photo">
      {photoUrl ? (
        <img src={photoUrl} alt="" />
      ) : (
        <span aria-hidden>{getPlayerInitials(name)}</span>
      )}
    </div>
  )
}

function PositionChange({ delta }: { delta: number }) {
  if (delta > 0) {
    return (
      <span className="kink-frame-social-lb-move kink-frame-social-lb-move--up" aria-label={`Up ${delta}`}>
        ↑{delta}
      </span>
    )
  }

  if (delta < 0) {
    return (
      <span
        className="kink-frame-social-lb-move kink-frame-social-lb-move--down"
        aria-label={`Down ${Math.abs(delta)}`}
      >
        ↓{Math.abs(delta)}
      </span>
    )
  }

  return (
    <span className="kink-frame-social-lb-move kink-frame-social-lb-move--flat" aria-hidden>
      —
    </span>
  )
}

function PodiumRow({
  entry,
  rank,
  broadcastIndex,
}: {
  entry: KinkFrameSocialStanding
  rank: number
  broadcastIndex: number
}) {
  return (
    <li
      className={[
        'kink-frame-social-lb-podium-item',
        `kink-frame-social-lb-podium-item--${rank}`,
        'kink-frame-broadcast-item',
        `kink-frame-broadcast-item--${broadcastIndex}`,
      ].join(' ')}
    >
      <article className="kink-frame-social-lb-podium-card">
        <div className={`kink-frame-social-lb-medal kink-frame-social-lb-medal--${rank}`} aria-hidden>
          <span>{rank}</span>
        </div>

        <div className="kink-frame-social-lb-podium-body">
          <div className="kink-frame-social-lb-podium-top">
            <span className="kink-frame-social-lb-name">
              {formatPlayerName(entry.name, 'first')}
            </span>
            <PositionChange delta={entry.positionChange} />
          </div>
          <span
            className={[
              'kink-frame-social-lb-points',
              entry.points >= 0
                ? 'kink-frame-social-lb-points--positive'
                : 'kink-frame-social-lb-points--negative',
            ].join(' ')}
          >
            {formatStandingPoints(entry.points)}
          </span>
        </div>

        <StandingPhoto name={entry.name} photoUrl={entry.photoUrl} />
      </article>
    </li>
  )
}

function ChaseRow({
  entry,
  rank,
  broadcastIndex,
}: {
  entry: KinkFrameSocialStanding
  rank: number
  broadcastIndex: number
}) {
  return (
    <li
      className={[
        'kink-frame-social-lb-chase-item',
        'kink-frame-broadcast-item',
        `kink-frame-broadcast-item--${broadcastIndex}`,
      ].join(' ')}
    >
      <article className="kink-frame-social-lb-chase-card">
        <span className="kink-frame-social-lb-chase-rank">{rank}</span>

        <div className="kink-frame-social-lb-chase-body">
          <span className="kink-frame-social-lb-name kink-frame-social-lb-name--chase">
            {formatPlayerName(entry.name, 'first')}
          </span>
          <span
            className={[
              'kink-frame-social-lb-points kink-frame-social-lb-points--chase',
              entry.points >= 0
                ? 'kink-frame-social-lb-points--positive'
                : 'kink-frame-social-lb-points--negative',
            ].join(' ')}
          >
            {formatStandingPoints(entry.points)}
          </span>
        </div>

        <PositionChange delta={entry.positionChange} />
      </article>
    </li>
  )
}

/** Social — broadcast-style standings in the right glass column. */
export function KinkFrameSocialRightPanel() {
  const podium = KINK_FRAME_SOCIAL_STANDINGS.slice(0, PODIUM_SIZE)
  const chase = KINK_FRAME_SOCIAL_STANDINGS.slice(PODIUM_SIZE)

  return (
    <KinkFrameModePanel label="Leaderboard" summary={`${KINK_FRAME_SOCIAL_STANDINGS.length} tonight`}>
      <div className="kink-frame-social-leaderboard">
        <ul className="kink-frame-social-lb-podium">
          {podium.map((entry, index) => (
            <PodiumRow key={entry.id} entry={entry} rank={index + 1} broadcastIndex={index + 2} />
          ))}
        </ul>

        <ul className="kink-frame-social-lb-chase">
          {chase.map((entry, index) => (
            <ChaseRow
              key={entry.id}
              entry={entry}
              rank={index + PODIUM_SIZE + 1}
              broadcastIndex={index + PODIUM_SIZE + 2}
            />
          ))}
        </ul>
      </div>
    </KinkFrameModePanel>
  )
}
