'use client'

import '@/app/styles/matchplay.css'
import { CourtIcon } from '@/components/matchplay/CourtIcon'
import '@/app/styles/matchplay-board.css'
import '@/app/styles/setup-form.css'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'

/** Map legacy ?state= values to current preview keys. */
function normalizeState(raw: string): string {
  const aliases: Record<string, string> = {
    setup: 'format',
    event_setup: 'format',
    fixtures: 'event',
    scoring: 'event',
    standings: 'event',
    standings_tv: 'board_live',
  }
  return aliases[raw] ?? raw
}

function DsFixturePhoto({ initials }: { initials: string }) {
  return (
    <div className="board-player-photo board-player-photo--sm board-player-photo--initials" aria-hidden>
      {initials}
    </div>
  )
}

function DsStandingsPlayerCell({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
  return (
    <div className="board-standings-player-cell">
      <div className="board-player-photo board-player-photo--sm board-player-photo--initials" aria-hidden>
        {initials}
      </div>
      <span className="board-standings-player-name">{name}</span>
    </div>
  )
}

/** Static previews using production class names — no Supabase. */
export default function MatchplayPreviewStates({ state }: { state: string }) {
  const s = normalizeState(state || 'launcher')

  if (s === 'launcher') {
    return (
      <div className="matchplay-launcher matchplay-launcher--compact" style={{ minHeight: '100vh' }}>
        <SetupScreenHeader />
        <MatchplayLauncherModePicker />
      </div>
    )
  }

  if (s === 'format') {
    return (
      <div className="matchplay-page matchplay-page--setup" style={{ minHeight: '100vh' }}>
        <header className="matchplay-brand-header">
          <span className="matchplay-brand-text">PalaPoint</span>
        </header>
        <div className="matchplay-page-header">
          <span className="matchplay-back-btn">← Back</span>
          <h1 className="matchplay-page-title">New Americano</h1>
          <span className="matchplay-page-header-spacer" aria-hidden />
        </div>

        <div className="matchplay-setup-inner">
          <div className="matchplay-setup-content">
            <div className="matchplay-card">
              <span className="matchplay-card-label">Players</span>
              <div className="matchplay-pill-bar">
                {[6, 8, 10, 12, 14, 16, 20].map((n) => (
                  <span key={n} className={`matchplay-pill-bar-item ${n === 8 ? 'matchplay-pill-bar-item--selected' : ''}`}>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="matchplay-card">
              <span className="matchplay-card-label">Courts</span>
              <div className="matchplay-court-grid">
                {[1, 2, 3, 4].map((n) => {
                  const sel = n === 1 || n === 2
                  return (
                    <span
                      key={n}
                      className={`matchplay-court-btn ${sel ? 'matchplay-court-btn--selected' : ''}`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <CourtIcon />
                      <span className="matchplay-court-num">{n}</span>
                    </span>
                  )
                })}
              </div>
              <p className="matchplay-card-hint">8 players · 2 courts · 0 resting per round</p>
            </div>

            <div className="matchplay-card">
              <span className="matchplay-card-label">Points per match</span>
              <div className="matchplay-pill-bar">
                {[16, 24, 32].map((n) => (
                  <span key={n} className={`matchplay-pill-bar-item ${n === 32 ? 'matchplay-pill-bar-item--selected' : ''}`}>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="matchplay-card">
              <span className="matchplay-card-label">Rounds</span>
              <div className="matchplay-pill-bar">
                {[3, 4, 5, 6, 7].map((n) => (
                  <span key={n} className={`matchplay-pill-bar-item ${n === 5 ? 'matchplay-pill-bar-item--selected' : ''}`}>
                    {n}
                  </span>
                ))}
              </div>
              <p className="matchplay-card-hint">Full rotation = 7 rounds</p>
            </div>

            <div className="matchplay-card matchplay-card--overview">
              <div className="matchplay-overview-row">
                <span className="matchplay-overview-label">Total matches</span>
                <span className="matchplay-overview-value">10</span>
              </div>
              <div className="matchplay-overview-row">
                <span className="matchplay-overview-label">Matches per player</span>
                <span className="matchplay-overview-value">~5</span>
              </div>
              <div className="matchplay-overview-row">
                <span className="matchplay-overview-label">Est. duration</span>
                <span className="matchplay-overview-value">40m</span>
              </div>
            </div>
          </div>
        </div>

        <footer className="matchplay-footer">
          <span className="matchplay-btn-primary" style={{ pointerEvents: 'none', display: 'block', textAlign: 'center' }}>
            Continue
          </span>
        </footer>
      </div>
    )
  }

  if (s === 'players') {
    const slots: { name: string; photo?: 'initials' | 'img' }[] = [
      { name: 'Glen Noble', photo: 'img' },
      { name: 'Rob Anderson' },
      { name: 'Julian Waters' },
      { name: 'Carl Pettit' },
      { name: 'Sam Wilson' },
      { name: 'Jake Thomas' },
      { name: '' },
      { name: '' },
    ]
    const filled = slots.filter((row) => row.name.trim()).length
    return (
      <div className="matchplay-page matchplay-page--setup" style={{ minHeight: '100vh' }}>
        <header className="matchplay-brand-header">
          <span className="matchplay-brand-text">PalaPoint</span>
        </header>
        <div className="matchplay-page-header">
          <span className="matchplay-back-btn">← Back</span>
          <h1 className="matchplay-page-title">Players</h1>
          <span className="matchplay-header-badge">
            {filled} of {slots.length}
          </span>
        </div>

        <div className="matchplay-setup-inner">
          <div className="matchplay-players-content">
            <div className="matchplay-card">
              <div className="matchplay-players-grid">
                {slots.map((slot, index) => (
                  <div key={index} className="matchplay-player-row">
                    <span
                      className={`matchplay-player-avatar ${slot.photo === 'img' ? 'matchplay-player-avatar--has-photo' : ''}`}
                      aria-hidden
                    >
                      {slot.photo === 'img' ? (
                        <span className="matchplay-ds-photo-fake" />
                      ) : slot.name ? (
                        <span className="matchplay-player-initials">
                          {slot.name
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()}
                        </span>
                      ) : (
                        <svg
                          className="matchplay-player-camera-icon"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <rect x="3" y="6" width="18" height="14" rx="2" />
                          <circle cx="12" cy="13" r="4" />
                          <path d="M9 3h6l1.5 3h-9z" />
                        </svg>
                      )}
                    </span>
                    <input
                      type="text"
                      className="matchplay-player-input"
                      placeholder={`Player ${index + 1}`}
                      readOnly
                      value={slot.name}
                    />
                  </div>
                ))}
              </div>
              <p className="matchplay-card-hint matchplay-card-hint--center">
                Americano works best with multiples of 4 (8, 12, 16 players)
              </p>
            </div>
          </div>
        </div>

        <footer className="matchplay-footer">
          <span
            className="matchplay-btn-primary"
            style={{ pointerEvents: 'none', opacity: 0.5, display: 'block', textAlign: 'center' }}
          >
            Start Event
          </span>
        </footer>
      </div>
    )
  }

  if (s === 'event') {
    return (
      <div className="matchplay-event-page" style={{ minHeight: '100vh' }}>
        <header className="matchplay-event-header">
          <span className="matchplay-event-back" aria-hidden>
            ←
          </span>
          <h1 className="matchplay-event-title">Tue 22 Apr Americano</h1>
          <div className="matchplay-event-header-actions">
            <span className="matchplay-event-icon-btn" aria-hidden>
              👥
            </span>
            <span className="matchplay-event-icon-btn" aria-hidden>
              📊
            </span>
            <div className="matchplay-event-header-right">
              <span className="matchplay-event-menu-wrap">
                <span className="matchplay-event-menu-btn" aria-hidden>
                  ⋮
                </span>
              </span>
              <span className="matchplay-event-status-badge matchplay-event-status-live">
                <span className="matchplay-event-status-dot" aria-hidden />
                LIVE
              </span>
            </div>
          </div>
        </header>
        <div className="matchplay-event-round-tabs-wrap">
          <div className="matchplay-event-round-tabs">
            <button type="button" className="matchplay-event-round-tab completed">
              Round 1<span className="matchplay-event-round-check">✓</span>
            </button>
            <button type="button" className="matchplay-event-round-tab active in-progress">
              Round 2<span className="matchplay-event-round-dot">·</span>
            </button>
            <button type="button" className="matchplay-event-round-tab">
              Round 3
            </button>
            <button type="button" className="matchplay-event-round-tab">
              Round 4
            </button>
          </div>
        </div>
        <div className="matchplay-event-matches">
          <div className="matchplay-event-match-card matchplay-event-match-card-completed">
            <span className="matchplay-event-match-court">Court 1</span>
            <span className="matchplay-event-match-summary">
              Glen Noble + Rob Anderson{' '}
              <span className="matchplay-event-match-summary-score">
                <span>18</span>
                <ScoreSepBar className="matchplay-event-match-summary-sep" />
                <span>14</span>
              </span>{' '}
              Julian Waters + Carl Pettit
            </span>
            <span className="matchplay-event-match-done">✓</span>
          </div>
          <div className="matchplay-event-match-card matchplay-event-match-card-expanded">
            <div className="matchplay-event-match-header">
              <span className="matchplay-event-match-court">Court 2</span>
            </div>
            <div className="matchplay-event-score-entry">
              <div className="matchplay-event-score-row">
                <span className="matchplay-event-score-team">Sam Wilson + Jake Thomas</span>
                <div className="matchplay-event-stepper">
                  <span className="matchplay-event-stepper-btn">−</span>
                  <span className="matchplay-event-stepper-value">12</span>
                  <span className="matchplay-event-stepper-btn">+</span>
                </div>
              </div>
              <div className="matchplay-event-vs">vs</div>
              <div className="matchplay-event-score-row">
                <span className="matchplay-event-score-team">Mike Brown + Tom Davis</span>
                <span className="matchplay-event-stepper-value">20</span>
              </div>
            </div>
            <div className="matchplay-event-result-preview">Result: Mike Brown + Tom Davis win</div>
            <div className="matchplay-event-score-actions">
              <span className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
                CANCEL
              </span>
              <span className="btn btn-primary" style={{ pointerEvents: 'none' }}>
                CONFIRM SCORE
              </span>
            </div>
          </div>
        </div>
        <div className="matchplay-event-resting">
          <div className="matchplay-event-resting-title">Resting this round</div>
          <div className="matchplay-event-resting-list">
            <span className="matchplay-event-resting-player">Alex Chen</span>
          </div>
        </div>
        <footer className="matchplay-event-footer">
          <span className="btn btn-primary matchplay-event-footer-btn" style={{ pointerEvents: 'none' }}>
            NEXT ROUND
          </span>
        </footer>
      </div>
    )
  }

  if (s === 'board_setup') {
    return (
      <div className="board-container board-live">
        <header className="board-header">
          <div className="board-header-logo">
            <span className="board-venue-name">Padel4All</span>
          </div>
          <h1 className="board-header-title">Tue 22 Apr Americano</h1>
          <div className="board-header-right">
            <div className="board-round-indicator">ROUND 1 of 5</div>
            <div className="board-badge board-badge-starting">
              <span className="board-badge-dot board-badge-dot-starting" aria-hidden />
              <span>STARTING SOON</span>
            </div>
          </div>
        </header>
        <div className="board-main board-main-split">
          <div className="board-panel board-fixtures">
            <div className="board-panel-title">ROUND 1 FIXTURES</div>
            <div className="board-fixture-list">
              <div className="board-fixture">
                <div className="board-fixture-court">Court 1</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="GN" />
                        <DsFixturePhoto initials="JW" />
                      </div>
                      <span className="board-fixture-names">Glen + Julian</span>
                    </div>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="RA" />
                        <DsFixturePhoto initials="CP" />
                      </div>
                      <span className="board-fixture-names">Rob + Carl</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="board-fixture">
                <div className="board-fixture-court">Court 2</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="SW" />
                        <DsFixturePhoto initials="JT" />
                      </div>
                      <span className="board-fixture-names">Sam + Jake</span>
                    </div>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="MB" />
                        <DsFixturePhoto initials="TD" />
                      </div>
                      <span className="board-fixture-names">Mike + Tom</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="board-resting">Resting this round: Alex Chen</div>
          </div>
          <div className="board-panel board-standings">
            <div className="board-panel-title">STANDINGS</div>
            <div className="board-standings-empty">Standings will appear after Round 1</div>
          </div>
        </div>
        <footer className="board-footer">
          <div className="board-footer-left">Americano · 32 pts per match · 2 courts</div>
          <div className="board-footer-right">
            <span className="board-footer-credit">palapoint</span>
          </div>
        </footer>
      </div>
    )
  }

  if (s === 'board_live') {
    return (
      <div className="board-container board-live">
        <header className="board-header">
          <div className="board-header-logo">
            <span className="board-venue-name">Padel4All</span>
          </div>
          <h1 className="board-header-title">Tue 22 Apr Americano</h1>
          <div className="board-header-right">
            <div className="board-round-indicator">ROUND 2 of 5</div>
            <div className="board-badge board-badge-live">
              <span className="board-badge-dot board-badge-dot-live" aria-hidden />
              <span>LIVE</span>
            </div>
          </div>
        </header>
        <div className="board-main board-main-split">
          <div className="board-panel board-fixtures">
            <div className="board-panel-title">ROUND 2 FIXTURES</div>
            <div className="board-fixture-list">
              <div className="board-fixture">
                <div className="board-fixture-court">Court 1</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team board-fixture-team-winner">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="GN" />
                        <DsFixturePhoto initials="JW" />
                      </div>
                      <span className="board-fixture-names">Glen + Julian</span>
                    </div>
                    <span className="board-fixture-score">18</span>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="RA" />
                        <DsFixturePhoto initials="CP" />
                      </div>
                      <span className="board-fixture-names">Rob + Carl</span>
                    </div>
                    <span className="board-fixture-score">14</span>
                  </div>
                </div>
                <span className="board-fixture-check">✓</span>
              </div>
              <div className="board-fixture">
                <div className="board-fixture-court">Court 2</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="SW" />
                        <DsFixturePhoto initials="JT" />
                      </div>
                      <span className="board-fixture-names">Sam + Jake</span>
                    </div>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <div className="board-fixture-photos">
                        <DsFixturePhoto initials="MB" />
                        <DsFixturePhoto initials="TD" />
                      </div>
                      <span className="board-fixture-names">Mike + Tom</span>
                    </div>
                  </div>
                </div>
                <div className="board-fixture-status">
                  <span className="board-fixture-status-dot" aria-hidden />
                  In Progress
                </div>
              </div>
            </div>
            <div className="board-resting">Resting this round: Alex Chen</div>
          </div>
          <div className="board-panel board-standings">
            <div className="board-panel-title">STANDINGS</div>
            <table className="board-standings-table board-standings-table--live">
              <thead>
                <tr>
                  <th className="board-th-rank">#</th>
                  <th className="board-th-player">Player</th>
                  <th className="board-th-points">P</th>
                  <th className="board-th-diff">+/-</th>
                </tr>
              </thead>
              <tbody>
                <tr className="board-standings-row board-row-tied">
                  <td className="board-td-rank board-td-rank-cell">1</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Glen Noble" />
                  </td>
                  <td className="board-td-points">38</td>
                  <td className="board-td-diff">+12</td>
                </tr>
                <tr className="board-standings-row board-row-tied">
                  <td className="board-td-rank board-td-rank-cell">1</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Julian Waters" />
                  </td>
                  <td className="board-td-points">38</td>
                  <td className="board-td-diff">+12</td>
                </tr>
                <tr className="board-standings-row">
                  <td className="board-td-rank board-td-rank-cell">3</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Rob Anderson" />
                  </td>
                  <td className="board-td-points">30</td>
                  <td className="board-td-diff">+2</td>
                </tr>
                <tr className="board-standings-row">
                  <td className="board-td-rank board-td-rank-cell">4</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Carl Pettit" />
                  </td>
                  <td className="board-td-points">28</td>
                  <td className="board-td-diff">−2</td>
                </tr>
                <tr className="board-standings-row board-row-resting">
                  <td className="board-td-rank board-td-rank-cell board-td-rank-resting" aria-hidden>
                    ·
                  </td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Alex Chen" />
                  </td>
                  <td className="board-td-points">0</td>
                  <td className="board-td-diff">0</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <footer className="board-footer">
          <div className="board-footer-left">Americano · 32 pts per match · 2 courts</div>
          <div className="board-footer-right">
            <span className="board-footer-credit">palapoint</span>
          </div>
        </footer>
      </div>
    )
  }

  if (s === 'board_completed') {
    return (
      <div className="board-container board-completed">
        <header className="board-header">
          <div className="board-header-logo">
            <span className="board-venue-name">Padel4All</span>
          </div>
          <h1 className="board-header-title">Tue 22 Apr Americano</h1>
          <div className="board-header-right">
            <div className="board-badge board-badge-final">
              <span className="board-badge-dot board-badge-dot-final" aria-hidden />
              <span>FINAL</span>
            </div>
          </div>
        </header>

        <div className="board-main board-main-single board-podium-visible">
          <div className="board-winner-section">
            <div className="board-winner-trophy">🏆</div>
            <div className="board-winner-label">WINNER</div>
            <div className="board-winner-card">
              <div className="board-winner-names">
                <span className="board-winner-name">Glen Noble</span>
              </div>
              <div className="board-winner-stats">95 pts • GD +24</div>
            </div>

            <div className="board-podium">
              <div className="board-podium-platform board-podium-2nd">
                <div className="board-podium-label">2nd</div>
                <div className="board-podium-names">
                  <span>Julian Waters</span>
                </div>
                <div className="board-podium-medal">🥈</div>
              </div>
              <div className="board-podium-platform board-podium-1st">
                <div className="board-podium-label">1st</div>
                <div className="board-podium-names">
                  <span>Glen Noble</span>
                </div>
                <div className="board-podium-medal">🥇</div>
              </div>
              <div className="board-podium-platform board-podium-3rd">
                <div className="board-podium-label">3rd</div>
                <div className="board-podium-names">
                  <span>Rob Anderson</span>
                </div>
                <div className="board-podium-medal">🥉</div>
              </div>
            </div>

            <div className="board-winner-divider" />
            <div className="board-standings-title">FINAL STANDINGS</div>
            <table className="board-standings-table">
              <thead>
                <tr>
                  <th className="board-th-rank">#</th>
                  <th className="board-th-player">Player</th>
                  <th className="board-th-num">P</th>
                  <th className="board-th-num">W</th>
                  <th className="board-th-num">D</th>
                  <th className="board-th-num">L</th>
                  <th className="board-th-num">GD</th>
                  <th className="board-th-pts">Pts</th>
                </tr>
              </thead>
              <tbody>
                <tr className="board-rank-1">
                  <td className="board-td-rank board-td-rank-cell board-td-rank-medal">🥇</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Glen Noble" />
                  </td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">+24</td>
                  <td className="board-td-pts">95</td>
                </tr>
                <tr className="board-rank-2">
                  <td className="board-td-rank board-td-rank-cell board-td-rank-medal">🥈</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Julian Waters" />
                  </td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">4</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">+10</td>
                  <td className="board-td-pts">82</td>
                </tr>
                <tr className="board-rank-3">
                  <td className="board-td-rank board-td-rank-cell board-td-rank-medal">🥉</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Rob Anderson" />
                  </td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">3</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">+4</td>
                  <td className="board-td-pts">71</td>
                </tr>
                <tr>
                  <td className="board-td-rank board-td-rank-cell">4</td>
                  <td className="board-td-player">
                    <DsStandingsPlayerCell name="Carl Pettit" />
                  </td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">3</td>
                  <td className="board-td-num">−6</td>
                  <td className="board-td-pts">58</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <footer className="board-footer">
          <div className="board-footer-left">Americano · 32 pts per match · 2 courts</div>
          <div className="board-footer-right">
            <span className="board-footer-credit">palapoint</span>
          </div>
        </footer>
      </div>
    )
  }

  return (
    <div className="matchplay-launcher matchplay-launcher--compact" style={{ minHeight: '100vh' }}>
      <SetupScreenHeader />
      <p className="matchplay-loading-text" style={{ marginBottom: 'var(--ui-space-md)' }}>
        Unknown preview state &quot;{state}&quot; — showing launcher. Try{' '}
        <code>
          ?state=launcher|format|event_setup|players|event|board_setup|board_live|board_completed
        </code>{' '}
        (aliases: <code>setup</code> → Event Setup, <code>fixtures|scoring|standings</code> → Event Hub).
      </p>
      <MatchplayLauncherModePicker />
    </div>
  )
}
