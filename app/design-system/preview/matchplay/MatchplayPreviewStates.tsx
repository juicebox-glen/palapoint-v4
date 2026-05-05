'use client'

import '@/app/styles/matchplay.css'
import { CourtIcon } from '@/components/matchplay/CourtIcon'
import '@/app/styles/matchplay-board.css'
import '@/app/styles/setup-form.css'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import { MATCHPLAY_AMERICANO_PLAYER_OPTIONS } from '@/lib/matchplay-americano-setup'
import { formatPlayerName, formatTeamDisplay, getPlayerInitials } from '@/lib/utils/name-format'

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

function DsFixturePhoto({ name }: { name: string }) {
  return (
    <div className="board-player-photo board-player-photo--sm board-player-photo--initials" aria-hidden>
      {getPlayerInitials(name)}
    </div>
  )
}

/** Match `/matchplay/[id]/board` fixture labels: first-name pairs via `formatTeamDisplay`. */
function DsFixturePhotosAndTeamName({ p1, p2 }: { p1: string; p2: string }) {
  return (
    <>
      <div className="board-fixture-photos">
        <DsFixturePhoto name={p1} />
        <DsFixturePhoto name={p2} />
      </div>
      <span className="board-fixture-names">{formatTeamDisplay(p1, p2, 1, 'first')}</span>
    </>
  )
}

function DsStandingsPlayerCell({ name }: { name: string }) {
  const initials = getPlayerInitials(name)
  return (
    <div className="board-standings-player-cell">
      <div className="board-player-photo board-player-photo--sm board-player-photo--initials" aria-hidden>
        {initials}
      </div>
      <span className="board-standings-player-name">{formatPlayerName(name, 'full')}</span>
    </div>
  )
}

/** Same icon as staff setup `PlayerPhotoCapture` — native picker opens from hidden file input in production. */
function DsSetupCameraIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="setup-photo-trigger-svg"
      aria-hidden
    >
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}

/** Static decoration matching `/matchplay/new/players` photo column (`setup-photo-thumb` / `setup-photo-trigger`). */
function DsMatchplayAddPlayersPhotoSlot({ hasPhoto }: { hasPhoto: boolean }) {
  if (hasPhoto) {
    return (
      <div className="setup-photo-circle-wrap">
        <span className="setup-photo-thumb" style={{ pointerEvents: 'none', cursor: 'default' }}>
          <span className="matchplay-ds-photo-fake" />
        </span>
        <span className="setup-photo-remove" style={{ pointerEvents: 'none' }} aria-hidden>
          ×
        </span>
      </div>
    )
  }
  return (
    <span className="setup-photo-trigger setup-photo-trigger--static" aria-hidden>
      <DsSetupCameraIcon />
    </span>
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
        <div className="matchplay-page-header">
          <span className="matchplay-back-btn">← Back</span>
          <h1 className="matchplay-page-title">New Americano</h1>
          <span className="matchplay-page-header-spacer" aria-hidden />
        </div>

        <div className="matchplay-setup-inner">
          <div className="matchplay-setup-content">
            <div className="matchplay-card">
              <span className="matchplay-card-label">Players</span>
              <div className="matchplay-pill-bar matchplay-pill-bar--players">
                {MATCHPLAY_AMERICANO_PLAYER_OPTIONS.map((n) => (
                  <span key={n} className={`matchplay-pill-bar-item ${n === 8 ? 'matchplay-pill-bar-item--selected' : ''}`}>
                    {n}
                  </span>
                ))}
              </div>
            </div>

            <div className="matchplay-card">
              <span className="matchplay-card-label">Select Courts</span>
              <div className="matchplay-court-grid">
                {[1, 2, 3, 4].map((n) => {
                  const sel = n === 1 || n === 2
                  return (
                    <div
                      key={n}
                      className={`matchplay-court-btn ${sel ? 'matchplay-court-btn--selected' : ''}`}
                      style={{ pointerEvents: 'none' }}
                    >
                      <div className="matchplay-court-icon-wrap">
                        <CourtIcon />
                      </div>
                      <span className="matchplay-court-num">{n}</span>
                    </div>
                  )
                })}
              </div>
              <div className="matchplay-court-summary">
                <span className="matchplay-court-summary-item">
                  <strong>8</strong> players
                </span>
                <span className="matchplay-court-summary-divider">·</span>
                <span className="matchplay-court-summary-item">
                  <strong>2</strong> courts
                </span>
              </div>
            </div>

            <div className="matchplay-card">
              <span className="matchplay-card-label">Points per Match</span>
              <div className="matchplay-pill-bar">
                {[16, 24, 32].map((n) => (
                  <span key={n} className={`matchplay-pill-bar-item ${n === 32 ? 'matchplay-pill-bar-item--selected' : ''}`}>
                    {n}
                  </span>
                ))}
              </div>
              <p className="matchplay-card-hint">~8 min per match</p>
            </div>

            <div className="matchplay-card">
              <span className="matchplay-card-label">Rounds</span>
              <div className="matchplay-pill-bar">
                {[3, 4, 5, 6, 7].map((n) => (
                  <span key={n} className={`matchplay-pill-bar-item ${n === 7 ? 'matchplay-pill-bar-item--selected' : ''}`}>
                    {n}
                  </span>
                ))}
              </div>
              <p className="matchplay-card-hint">Full rotation = 7 rounds</p>
            </div>

            <div className="matchplay-card matchplay-card--overview">
              <div className="matchplay-overview-row">
                <span className="matchplay-overview-label">Total matches</span>
                <span className="matchplay-overview-value">14</span>
              </div>
              <div className="matchplay-overview-row">
                <span className="matchplay-overview-label">Matches per player</span>
                <span className="matchplay-overview-value">~7</span>
              </div>
              <div className="matchplay-overview-row">
                <span className="matchplay-overview-label">Est. duration</span>
                <span className="matchplay-overview-value">56m</span>
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
    const slots: { name: string; hasPhoto?: boolean }[] = [
      { name: 'Glen Noble', hasPhoto: true },
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
        <div className="matchplay-page-header">
          <span className="matchplay-back-btn">← Back</span>
          <h1 className="matchplay-page-title">Players</h1>
          <span className="matchplay-page-header-spacer" aria-hidden />
        </div>

        <div className="matchplay-setup-inner">
          <div className="matchplay-setup-content">
            <div className="matchplay-card">
              <div className="matchplay-card-label-row">
                <span className="matchplay-card-label">Add Players</span>
                <span className="matchplay-card-label-count">
                  {filled} of {slots.length}
                </span>
              </div>
              <div className="setup-inputs">
                {slots.map((slot, index) => (
                  <div key={index} className="setup-player-row">
                    <DsMatchplayAddPlayersPhotoSlot hasPhoto={!!slot.hasPhoto && !!slot.name.trim()} />
                    <div className="setup-input-wrap setup-input-wrap--player-name">
                      <input
                        type="text"
                        className="setup-input"
                        placeholder={`Player ${index + 1}`}
                        readOnly
                        value={slot.name}
                      />
                    </div>
                  </div>
                ))}
              </div>
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
        <header className="matchplay-hub-header">
          <span className="matchplay-hub-back" aria-hidden>
            ←
          </span>
          <h1 className="matchplay-hub-title">Event</h1>
          <div className="matchplay-hub-actions">
            <span className="matchplay-hub-icon-btn" aria-hidden>
              👥
            </span>
            <span className="matchplay-hub-icon-btn" aria-hidden>
              📊
            </span>
          </div>
        </header>
        <nav className="matchplay-hub-rounds">
          <button type="button" className="matchplay-hub-round-tab matchplay-hub-round-tab--completed">
            ROUND 1<span className="matchplay-hub-round-check">✓</span>
          </button>
          <button type="button" className="matchplay-hub-round-tab matchplay-hub-round-tab--active">
            ROUND 2
          </button>
          <button type="button" className="matchplay-hub-round-tab">ROUND 3</button>
          <button type="button" className="matchplay-hub-round-tab">ROUND 4</button>
        </nav>
        <div className="matchplay-hub-matches">
          <div className="matchplay-hub-match matchplay-card matchplay-hub-match--completed">
            <div className="matchplay-hub-match-compact">
              <div className="matchplay-hub-match-team matchplay-hub-match-team--a">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Glen Noble', 'surname_short')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Rob Anderson', 'surname_short')}</span>
              </div>
              <div className="matchplay-hub-match-score">
                <span className="matchplay-hub-match-score-num">18</span>
              </div>
              <div className="matchplay-hub-match-center">
                <span className="matchplay-hub-match-center-rule" aria-hidden />
                <span className="matchplay-hub-match-vs">VS</span>
                <span className="matchplay-hub-match-court">Court 1</span>
                <span className="matchplay-hub-match-center-rule" aria-hidden />
              </div>
              <div className="matchplay-hub-match-score">
                <span className="matchplay-hub-match-score-num">14</span>
              </div>
              <div className="matchplay-hub-match-team matchplay-hub-match-team--b">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Julian Waters', 'surname_short')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Carl Pettit', 'surname_short')}</span>
              </div>
            </div>
          </div>
          <div className="matchplay-hub-match matchplay-card matchplay-hub-match--pending matchplay-hub-match--expanded">
            <div className="matchplay-hub-match-compact">
              <div className="matchplay-hub-match-team matchplay-hub-match-team--a">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Sam Wilson', 'surname_short')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Jake Thomas', 'surname_short')}</span>
              </div>
              <div className="matchplay-hub-match-score">
                <span className="matchplay-hub-match-score-num">0</span>
              </div>
              <div className="matchplay-hub-match-center">
                <span className="matchplay-hub-match-center-rule" aria-hidden />
                <span className="matchplay-hub-match-vs">VS</span>
                <span className="matchplay-hub-match-court">Court 2</span>
                <span className="matchplay-hub-match-center-rule" aria-hidden />
              </div>
              <div className="matchplay-hub-match-score">
                <span className="matchplay-hub-match-score-num">0</span>
              </div>
              <div className="matchplay-hub-match-team matchplay-hub-match-team--b">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Mike Brown', 'surname_short')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Tom Davis', 'surname_short')}</span>
              </div>
            </div>
            <div className="matchplay-hub-match-entry">
              <div className="matchplay-hub-match-entry-row">
                <span className="matchplay-hub-match-entry-team">{formatTeamDisplay('Sam Wilson', 'Jake Thomas', 1, 'first')}</span>
                <div className="matchplay-hub-match-stepper">
                  <span className="matchplay-hub-stepper-btn">−</span>
                  <span className="matchplay-hub-stepper-value">12</span>
                  <span className="matchplay-hub-stepper-btn">+</span>
                </div>
              </div>
              <div className="matchplay-hub-match-entry-vs">vs</div>
              <div className="matchplay-hub-match-entry-row">
                <span className="matchplay-hub-match-entry-team">{formatTeamDisplay('Mike Brown', 'Tom Davis', 2, 'first')}</span>
                <div className="matchplay-hub-match-stepper">
                  <span className="matchplay-hub-stepper-btn">−</span>
                  <span className="matchplay-hub-stepper-value">20</span>
                  <span className="matchplay-hub-stepper-btn">+</span>
                </div>
              </div>
              <p className="matchplay-hub-match-entry-result">
                Result: {formatTeamDisplay('Mike Brown', 'Tom Davis', 2, 'first')} win
              </p>
              <div className="matchplay-hub-match-entry-actions">
                <span className="matchplay-hub-btn matchplay-hub-btn--secondary" style={{ pointerEvents: 'none' }}>
                  CANCEL
                </span>
                <span className="matchplay-hub-btn matchplay-hub-btn--primary" style={{ pointerEvents: 'none' }}>
                  CONFIRM SCORE
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="matchplay-hub-resting">
          <div className="matchplay-hub-resting-title">Resting this round</div>
          <div className="matchplay-hub-resting-list">
            <span className="matchplay-hub-resting-player">{formatPlayerName('Alex Chen', 'full')}</span>
          </div>
        </div>
        <footer className="matchplay-hub-footer">
          <span className="matchplay-hub-footer-btn" style={{ pointerEvents: 'none', display: 'block', textAlign: 'center' }}>
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
            <span className="board-venue-name">Venue</span>
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
                      <DsFixturePhotosAndTeamName p1="Glen Noble" p2="Julian Waters" />
                    </div>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <DsFixturePhotosAndTeamName p1="Rob Anderson" p2="Carl Pettit" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="board-fixture">
                <div className="board-fixture-court">Court 2</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <DsFixturePhotosAndTeamName p1="Sam Wilson" p2="Jake Thomas" />
                    </div>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <DsFixturePhotosAndTeamName p1="Mike Brown" p2="Tom Davis" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="board-resting">
              Resting this round: {formatPlayerName('Alex Chen', 'full')}
            </div>
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
            <span className="board-venue-name">Venue</span>
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
                      <DsFixturePhotosAndTeamName p1="Glen Noble" p2="Julian Waters" />
                    </div>
                    <span className="board-fixture-score">18</span>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <DsFixturePhotosAndTeamName p1="Rob Anderson" p2="Carl Pettit" />
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
                      <DsFixturePhotosAndTeamName p1="Sam Wilson" p2="Jake Thomas" />
                    </div>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    <div className="board-fixture-team-main">
                      <DsFixturePhotosAndTeamName p1="Mike Brown" p2="Tom Davis" />
                    </div>
                  </div>
                </div>
                <div className="board-fixture-status">
                  <span className="board-fixture-status-dot" aria-hidden />
                  In Progress
                </div>
              </div>
            </div>
            <div className="board-resting">
              Resting this round: {formatPlayerName('Alex Chen', 'full')}
            </div>
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
            <span className="board-venue-name">Venue</span>
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
                <span className="board-winner-name">{formatPlayerName('Glen Noble', 'full')}</span>
              </div>
              <div className="board-winner-stats">95 pts • GD +24</div>
            </div>

            <div className="board-podium">
              <div className="board-podium-platform board-podium-2nd">
                <div className="board-podium-label">2nd</div>
                <div className="board-podium-names">
                  <span>{formatPlayerName('Julian Waters', 'full')}</span>
                </div>
                <div className="board-podium-medal">🥈</div>
              </div>
              <div className="board-podium-platform board-podium-1st">
                <div className="board-podium-label">1st</div>
                <div className="board-podium-names">
                  <span>{formatPlayerName('Glen Noble', 'full')}</span>
                </div>
                <div className="board-podium-medal">🥇</div>
              </div>
              <div className="board-podium-platform board-podium-3rd">
                <div className="board-podium-label">3rd</div>
                <div className="board-podium-names">
                  <span>{formatPlayerName('Rob Anderson', 'full')}</span>
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
          ?state=launcher|format|players|event|board_setup|board_live|board_completed
        </code>{' '}
        (aliases: <code>setup</code> → Event Setup, <code>fixtures|scoring|standings</code> → Event Hub).
      </p>
      <MatchplayLauncherModePicker />
    </div>
  )
}
