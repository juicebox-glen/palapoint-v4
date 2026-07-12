import {
  KINK_FRAME_SOCIAL_FIXTURES,
  KINK_FRAME_SOCIAL_GAME,
} from '@/lib/layout/kink-frame-social-data'
import { formatTeamDisplay } from '@/lib/utils/name-format'

/** Skeleton social — title + round header and 2×2 court fixture grid (left column). */
export function KinkFrameSkeletonSocialLeftPanel() {
  const { title, round, totalRounds } = KINK_FRAME_SOCIAL_GAME

  return (
    <div className="kink-frame-skeleton-social-left">
      <header className="kink-frame-skeleton-social-header">
        <h2 className="kink-frame-skeleton-social-title">{title}</h2>
        <p className="kink-frame-skeleton-social-round">
          Round {round} of {totalRounds}
        </p>
      </header>

      <ul className="kink-frame-skeleton-social-fixtures">
        {KINK_FRAME_SOCIAL_FIXTURES.map((fixture) => (
          <li key={fixture.id} className="kink-frame-skeleton-social-fixtures__item">
            <article className="kink-frame-skeleton-social-fixture-card">
              <span className="kink-frame-skeleton-social-fixture-card__court">{fixture.court}</span>
              <div className="kink-frame-skeleton-social-fixture-card__matchup">
                <span className="kink-frame-skeleton-social-fixture-card__team">
                  {formatTeamDisplay(fixture.teamA[0], fixture.teamA[1], 1, 'first')}
                </span>
                <span className="kink-frame-skeleton-social-fixture-card__vs">vs</span>
                <span className="kink-frame-skeleton-social-fixture-card__team">
                  {formatTeamDisplay(fixture.teamB[0], fixture.teamB[1], 2, 'first')}
                </span>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </div>
  )
}
