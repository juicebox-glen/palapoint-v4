import {
  KINK_FRAME_SOCIAL_FIXTURES,
  KINK_FRAME_SOCIAL_GAME,
} from '@/lib/layout/kink-frame-social-data'
import { formatTeamDisplay } from '@/lib/utils/name-format'

/** Social — title card + 2×2 fixture grid in the left column. */
export function KinkFrameSocialLeftPanel() {
  const { title, format, time, round, totalRounds } = KINK_FRAME_SOCIAL_GAME

  return (
    <div className="kink-frame-mode-panel kink-frame-social-left">
      <div className="kink-frame-mode-panel__body">
        <article
          className={[
            'kink-frame-court-card',
            'kink-frame-court-card--busy',
            'kink-frame-social-title-card',
            'kink-frame-broadcast-item',
            'kink-frame-broadcast-item--0',
          ].join(' ')}
        >
          <div className="kink-frame-social-title-card__main">
            <p className="kink-frame-social-title-card__eyebrow">
              {format} · {time}
            </p>
            <h2 className="kink-frame-social-title-card__title">{title}</h2>
          </div>
          <div className="kink-frame-social-title-card__round" aria-label={`Round ${round} of ${totalRounds}`}>
            <span className="kink-frame-social-title-card__round-label">Round</span>
            <span className="kink-frame-social-title-card__round-value">
              {round}/{totalRounds}
            </span>
          </div>
        </article>

        <ul className="kink-frame-social-fixture-grid">
          {KINK_FRAME_SOCIAL_FIXTURES.map((fixture, index) => (
            <li
              key={fixture.id}
              className={[
                'kink-frame-social-fixture-grid__item',
                'kink-frame-broadcast-item',
                `kink-frame-broadcast-item--${index + 1}`,
              ].join(' ')}
            >
              <article className="kink-frame-court-card kink-frame-court-card--busy kink-frame-social-fixture-card">
                <span className="kink-frame-social-fixture-card__court">{fixture.court}</span>
                <div className="kink-frame-social-fixture-card__matchup">
                  <span className="kink-frame-social-fixture-card__team">
                    {formatTeamDisplay(fixture.teamA[0], fixture.teamA[1], 1, 'first')}
                  </span>
                  <span className="kink-frame-social-fixture-card__vs">vs</span>
                  <span className="kink-frame-social-fixture-card__team">
                    {formatTeamDisplay(fixture.teamB[0], fixture.teamB[1], 2, 'first')}
                  </span>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
