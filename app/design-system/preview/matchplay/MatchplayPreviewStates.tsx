'use client'

import '@/app/styles/matchplay.css'
import '@/app/styles/matchplay-board.css'
import '@/app/styles/setup-form.css'
import SetupScreenHeader from '@/components/SetupScreenHeader'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'

/** Map legacy ?state= values to current preview keys. */
function normalizeState(raw: string): string {
  const aliases: Record<string, string> = {
    setup: 'format',
    fixtures: 'event',
    scoring: 'event',
    standings: 'event',
    standings_tv: 'board_live',
  }
  return aliases[raw] ?? raw
}

/** Static previews using production class names — no Supabase. */
export default function MatchplayPreviewStates({ state }: { state: string }) {
  const s = normalizeState(state || 'launcher')

  if (s === 'launcher') {
    return (
      <div className="matchplay-launcher matchplay-launcher--compact" style={{ minHeight: '100vh' }}>
        <SetupScreenHeader />
        <h1 className="matchplay-launcher-title">Matchplay</h1>
        <div className="matchplay-mode-cards">
          <div className="matchplay-mode-card matchplay-mode-card-active">
            <div className="matchplay-mode-card-content">
              <h2 className="matchplay-mode-name">Americano</h2>
              <p className="matchplay-mode-desc">Everyone plays with everyone once</p>
              <span className="matchplay-mode-badge">Points-based scoring · auto-generated pairings</span>
            </div>
          </div>
          <div className="matchplay-mode-card matchplay-mode-card-coming">
            <span className="matchplay-coming-badge">COMING SOON</span>
            <div className="matchplay-mode-card-content">
              <h2 className="matchplay-mode-name">King of the Court</h2>
              <p className="matchplay-mode-desc">Elimination-style rotation</p>
            </div>
          </div>
          <div className="matchplay-mode-card matchplay-mode-card-coming">
            <span className="matchplay-coming-badge">COMING SOON</span>
            <div className="matchplay-mode-card-content">
              <h2 className="matchplay-mode-name">Matchplay</h2>
              <p className="matchplay-mode-desc">Curated social play with manual pairings</p>
            </div>
          </div>
          <div className="matchplay-mode-card matchplay-mode-card-coming">
            <span className="matchplay-coming-badge">COMING SOON</span>
            <div className="matchplay-mode-card-content">
              <h2 className="matchplay-mode-name">Mexicano</h2>
              <p className="matchplay-mode-desc">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (s === 'format') {
    return (
      <div className="matchplay-format-page" style={{ minHeight: '100vh' }}>
        <SetupScreenHeader />
        <div className="matchplay-format-header">
          <span className="matchplay-format-back">← Back</span>
          <h1 className="matchplay-format-title">Format Setup</h1>
        </div>
        <div className="matchplay-format-form">
          <div className="matchplay-format-section">
            <label className="matchplay-format-label">Courts</label>
            <div className="matchplay-pill-row">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={`matchplay-pill ${n === 2 ? 'active' : ''}`}>
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="matchplay-format-section">
            <label className="matchplay-format-label">Points per match</label>
            <p className="matchplay-format-hint matchplay-hint-text">
              Total points per match. Scores always sum to this number.
            </p>
            <div className="matchplay-pill-row">
              {[16, 24, 32].map((n) => (
                <span key={n} className={`matchplay-pill ${n === 32 ? 'active' : ''}`}>
                  {n}
                </span>
              ))}
            </div>
          </div>
          <div className="matchplay-format-section">
            <label className="matchplay-format-label">Rounds</label>
            <div className="matchplay-pill-row">
              {[3, 4, 5, 6].map((n) => (
                <span key={n} className={`matchplay-pill ${n === 4 ? 'active' : ''}`}>
                  {n}
                </span>
              ))}
            </div>
            <p className="matchplay-format-hint">Guide — Americano generates rounds so everyone partners with everyone</p>
          </div>
          <div className="matchplay-format-section matchplay-event-summary">
            <label className="matchplay-format-label">Event Summary</label>
            <div className="matchplay-summary-panel">
              <p>Matches per player: Add players to see full estimate</p>
              <p>Total matches: 8</p>
              <p>Estimated duration: ~1h 36m</p>
              <p className="matchplay-summary-based">Based on 2 courts · 4 rounds · 32 pts per match</p>
            </div>
          </div>
        </div>
        <div className="matchplay-format-footer">
          <span className="btn btn-primary matchplay-format-continue" style={{ pointerEvents: 'none' }}>
            Continue
          </span>
        </div>
      </div>
    )
  }

  if (s === 'players') {
    const names = ['Glen Noble', 'Rob Anderson', 'Julian Waters', 'Carl Pettit', 'Sam Wilson', 'Jake Thomas']
    return (
      <div className="matchplay-players-page" style={{ minHeight: '100vh' }}>
        <SetupScreenHeader />
        <div className="matchplay-players-header">
          <span className="matchplay-players-back">← Back</span>
          <h1 className="matchplay-players-title">Players</h1>
          <span className="matchplay-players-count">{names.length} added</span>
        </div>
        <div className="matchplay-players-input-wrap">
          <input type="text" className="input matchplay-players-input" placeholder="Enter name..." readOnly />
          <span className="btn btn-primary matchplay-players-add" style={{ pointerEvents: 'none' }}>
            ADD
          </span>
        </div>
        <div className="matchplay-players-list">
          {names.map((name) => (
            <div key={name} className="matchplay-players-row">
              <span className="matchplay-players-name">{name}</span>
              <span className="matchplay-players-remove" aria-hidden>
                ✕
              </span>
            </div>
          ))}
        </div>
        <p className="matchplay-players-hint">Americano works best with multiples of 4 (8, 12, 16 players)</p>
        <div className="matchplay-players-footer">
          <span className="btn btn-primary matchplay-players-start" style={{ pointerEvents: 'none' }}>
            START EVENT
          </span>
        </div>
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
    const players = [
      'Glen Noble',
      'Rob Anderson',
      'Julian Waters',
      'Carl Pettit',
      'Sam Wilson',
      'Jake Thomas',
      'Mike Brown',
      'Tom Davis',
    ]
    return (
      <div className="board-container board-setup">
        <div className="board-setup-content">
          <div className="board-brand">PalaPoint</div>
          <h1 className="board-event-name">Tue 22 Apr Americano</h1>
          <p className="board-event-date">22 Apr 2026</p>
          <div className="board-starting-soon">
            <span className="board-pulse-dot" aria-hidden />
            <span>STARTING SOON</span>
          </div>
          <div className="board-players-card">
            <div className="board-players-title">PLAYERS</div>
            <div className="board-players-grid">
              {players.map((name) => (
                <span key={name} className="board-player-name">
                  {name}
                </span>
              ))}
            </div>
            <div className="board-players-count">{players.length} players registered</div>
          </div>
        </div>
      </div>
    )
  }

  if (s === 'board_live') {
    return (
      <div className="board-container board-live">
        <div className="board-header">
          <h1 className="board-header-title">Tue 22 Apr Americano</h1>
          <div className="board-round-indicator">ROUND 2 of 5</div>
          <div className="board-badge board-badge-live">
            <span className="board-badge-dot board-badge-dot-live" aria-hidden />
            <span>LIVE</span>
          </div>
        </div>
        <div className="board-main">
          <div className="board-panel board-leaderboard">
            <div className="board-panel-title">LEADERBOARD</div>
            <table className="board-standings">
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
                  <td className="board-td-rank board-td-rank-cell">🥇</td>
                  <td className="board-td-player">Glen Noble</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">+12</td>
                  <td className="board-td-pts">38</td>
                </tr>
                <tr className="board-rank-2">
                  <td className="board-td-rank board-td-rank-cell">🥈</td>
                  <td className="board-td-player">Julian Waters</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">+8</td>
                  <td className="board-td-pts">35</td>
                </tr>
                <tr className="board-rank-3">
                  <td className="board-td-rank board-td-rank-cell">🥉</td>
                  <td className="board-td-player">Rob Anderson</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">+2</td>
                  <td className="board-td-pts">30</td>
                </tr>
                <tr>
                  <td className="board-td-rank board-td-rank-cell">4</td>
                  <td className="board-td-player">Carl Pettit</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">−2</td>
                  <td className="board-td-pts">28</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="board-panel board-fixtures">
            <div className="board-panel-title">ROUND 2</div>
            <div className="board-fixture-list">
              <div className="board-fixture">
                <div className="board-fixture-court">Court 1</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team board-fixture-team-winner">
                    Glen Noble + Julian Waters<span className="board-fixture-score">18</span>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    Rob Anderson + Carl Pettit<span className="board-fixture-score">14</span>
                  </div>
                </div>
                <span className="board-fixture-check">✓</span>
              </div>
              <div className="board-fixture">
                <div className="board-fixture-court">Court 2</div>
                <div className="board-fixture-teams">
                  <div className="board-fixture-team">Sam Wilson + Jake Thomas</div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">Mike Brown + Tom Davis</div>
                </div>
                <div className="board-fixture-status">
                  <span className="board-fixture-status-dot" aria-hidden />
                  In Progress
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="board-activity-feed">
          <span className="board-activity-dot" aria-hidden />
          Glen Noble + Julian Waters beat Rob Anderson + Carl Pettit 18–14 on Court 1 · just now
        </div>
        <div className="board-footer">Golden Point • First to 32 • Win 3 / Draw 1 / Loss 0</div>
      </div>
    )
  }

  if (s === 'board_completed') {
    return (
      <div className="board-container board-completed">
        <div className="board-header">
          <h1 className="board-header-title">Tue 22 Apr Americano</h1>
          <div className="board-badge board-badge-final">
            <span className="board-badge-dot board-badge-dot-final" aria-hidden />
            <span>FINAL</span>
          </div>
        </div>

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
            <table className="board-standings">
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
                  <td className="board-td-rank board-td-rank-cell">🥇</td>
                  <td className="board-td-player">Glen Noble</td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">+24</td>
                  <td className="board-td-pts">95</td>
                </tr>
                <tr className="board-rank-2">
                  <td className="board-td-rank board-td-rank-cell">🥈</td>
                  <td className="board-td-player">Julian Waters</td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">4</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">+10</td>
                  <td className="board-td-pts">82</td>
                </tr>
                <tr className="board-rank-3">
                  <td className="board-td-rank board-td-rank-cell">🥉</td>
                  <td className="board-td-player">Rob Anderson</td>
                  <td className="board-td-num">5</td>
                  <td className="board-td-num">3</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">+4</td>
                  <td className="board-td-pts">71</td>
                </tr>
                <tr>
                  <td className="board-td-rank board-td-rank-cell">4</td>
                  <td className="board-td-player">Carl Pettit</td>
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

        <div className="board-footer">5 rounds • 8 players • Golden Point • First to 32</div>
      </div>
    )
  }

  return (
    <div className="matchplay-launcher matchplay-launcher--compact" style={{ minHeight: '100vh' }}>
      <SetupScreenHeader />
      <h1 className="matchplay-launcher-title">Matchplay</h1>
      <p className="matchplay-loading-text" style={{ padding: '0 var(--ui-space-lg)' }}>
        Unknown preview state &quot;{state}&quot; — showing launcher. Try{' '}
        <code>?state=launcher|format|players|event|board_setup|board_live|board_completed</code>.
      </p>
      <div className="matchplay-mode-cards">
        <div className="matchplay-mode-card matchplay-mode-card-active">
          <div className="matchplay-mode-card-content">
            <h2 className="matchplay-mode-name">Americano</h2>
            <p className="matchplay-mode-desc">Everyone plays with everyone once</p>
          </div>
        </div>
      </div>
    </div>
  )
}
