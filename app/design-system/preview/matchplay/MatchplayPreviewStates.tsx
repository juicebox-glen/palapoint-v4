'use client'

import '@/app/styles/matchplay.css'
import '@/app/styles/matchplay-board.css'
import '@/app/styles/setup-form.css'

/** Static previews using production class names — no Supabase. */
export default function MatchplayPreviewStates({ state }: { state: string }) {
  const s = state || 'launcher'

  if (s === 'launcher') {
    return (
      <div className="matchplay-launcher" style={{ minHeight: '100vh' }}>
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
              <h2 className="matchplay-mode-name">Mexicano</h2>
              <p className="matchplay-mode-desc">Coming soon</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (s === 'setup' || s === 'format') {
    return (
      <div className="matchplay-format-page" style={{ minHeight: '100vh' }}>
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
    return (
      <div className="matchplay-players-page" style={{ minHeight: '100vh' }}>
        <div className="matchplay-players-header">
          <span className="matchplay-players-back">← Back</span>
          <h1 className="matchplay-players-title">Players</h1>
          <span className="matchplay-players-count">4 added</span>
        </div>
        <div className="matchplay-players-input-wrap">
          <input type="text" className="input matchplay-players-input" placeholder="Enter name..." readOnly />
          <span className="btn btn-primary matchplay-players-add" style={{ pointerEvents: 'none' }}>
            ADD
          </span>
        </div>
        <div className="matchplay-players-list">
          {['Alex Chen', 'Sam Jones', 'Jordan Lee', 'Taylor Smith'].map((name) => (
            <div key={name} className="matchplay-players-row">
              <span className="matchplay-players-name">{name}</span>
              <span className="matchplay-players-remove" aria-hidden>
                ✕
              </span>
            </div>
          ))}
        </div>
        <div className="matchplay-players-footer">
          <span className="btn btn-primary matchplay-players-start" style={{ pointerEvents: 'none' }}>
            START EVENT
          </span>
        </div>
      </div>
    )
  }

  if (s === 'fixtures') {
    return (
      <div className="matchplay-event-page" style={{ minHeight: '100vh' }}>
        <header className="matchplay-event-header">
          <span className="matchplay-event-back">←</span>
          <h1 className="matchplay-event-title">Sun 15 Apr Americano</h1>
          <div className="matchplay-event-header-right">
            <span className="matchplay-event-status-dot" aria-hidden />
            <span>SETUP</span>
          </div>
        </header>
        <div className="matchplay-event-round-tabs-wrap">
          <div className="matchplay-event-round-tabs">
            <button type="button" className="matchplay-event-round-tab active in-progress">
              Round 1<span className="matchplay-event-round-dot">·</span>
            </button>
            <button type="button" className="matchplay-event-round-tab completed">
              Round 2<span className="matchplay-event-round-check">✓</span>
            </button>
          </div>
        </div>
        <div className="matchplay-event-matches">
          <div className="matchplay-event-match-card matchplay-event-match-card-setup">
            <div className="matchplay-event-match-header">
              <span className="matchplay-event-match-court">Court 1</span>
              <span className="matchplay-event-match-edit-btn">EDIT</span>
            </div>
            <div className="matchplay-event-match-teams">Alex + Sam vs Jordan + Taylor</div>
          </div>
          <div className="matchplay-event-match-card matchplay-event-match-card-setup">
            <div className="matchplay-event-match-header">
              <span className="matchplay-event-match-court">Court 2</span>
            </div>
            <div className="matchplay-event-match-teams">Riley + Morgan vs Casey + Drew</div>
          </div>
        </div>
      </div>
    )
  }

  if (s === 'scoring') {
    return (
      <div className="matchplay-event-page" style={{ minHeight: '100vh' }}>
        <header className="matchplay-event-header">
          <span className="matchplay-event-back">←</span>
          <h1 className="matchplay-event-title">Sun 15 Apr Americano</h1>
          <div className="matchplay-event-header-right">
            <span className="matchplay-event-status-dot" aria-hidden />
            <span>LIVE</span>
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
          </div>
        </div>
        <div className="matchplay-event-matches">
          <div className="matchplay-event-match-card matchplay-event-match-card-expanded">
            <div className="matchplay-event-match-header">
              <span className="matchplay-event-match-court">Court 1</span>
            </div>
            <div className="matchplay-event-score-entry">
              <div className="matchplay-event-score-row">
                <span className="matchplay-event-score-team">Alex + Sam</span>
                <div className="matchplay-event-stepper">
                  <span className="matchplay-event-stepper-btn">−</span>
                  <span className="matchplay-event-stepper-value">18</span>
                  <span className="matchplay-event-stepper-btn">+</span>
                </div>
              </div>
              <div className="matchplay-event-vs">vs</div>
              <div className="matchplay-event-score-row">
                <span className="matchplay-event-score-team">Jordan + Taylor</span>
                <span className="matchplay-event-stepper-value">14</span>
              </div>
            </div>
            <div className="matchplay-event-result-preview">Result: Alex + Sam win</div>
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
      </div>
    )
  }

  if (s === 'standings') {
    return (
      <div className="matchplay-event-page" style={{ minHeight: '100vh', position: 'relative' }}>
        <p style={{ padding: '1rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Preview: staff event screen with standings modal (same markup as production).
        </p>
        <div className="matchplay-event-modal-overlay" style={{ position: 'absolute', inset: 0 }}>
          <div className="matchplay-event-modal matchplay-event-standings-modal" onClick={(e) => e.stopPropagation()}>
            <div className="matchplay-event-modal-header">
              <h2>Standings</h2>
              <span className="matchplay-event-modal-close" aria-hidden>
                ✕
              </span>
            </div>
            <div className="matchplay-event-modal-body">
              <div style={{ overflowX: 'auto' }}>
                <table className="matchplay-standings">
                  <thead>
                    <tr>
                      <th className="rank">#</th>
                      <th className="player">Player</th>
                      <th className="num">W</th>
                      <th className="num">T</th>
                      <th className="num">L</th>
                      <th className="num">P</th>
                      <th className="num">+/−</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="rank-1">
                      <td className="rank">🥇</td>
                      <td className="player">Alex Chen</td>
                      <td className="num">3</td>
                      <td className="num">0</td>
                      <td className="num">0</td>
                      <td className="num">24</td>
                      <td className="num">+12</td>
                    </tr>
                    <tr className="rank-2">
                      <td className="rank">🥈</td>
                      <td className="player">Sam Jones</td>
                      <td className="num">2</td>
                      <td className="num">1</td>
                      <td className="num">0</td>
                      <td className="num">18</td>
                      <td className="num">+4</td>
                    </tr>
                    <tr>
                      <td className="rank">3</td>
                      <td className="player">Jordan Lee</td>
                      <td className="num">1</td>
                      <td className="num">0</td>
                      <td className="num">2</td>
                      <td className="num">12</td>
                      <td className="num">−2</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (s === 'standings_tv') {
    return (
      <div className="board-container board-live" style={{ minHeight: '100vh' }}>
        <div className="board-header">
          <h1 className="board-header-title">Sun 15 Apr Americano</h1>
          <div className="board-round-indicator">ROUND 2 of 4</div>
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
                  <td className="board-td-player">Alex Chen</td>
                  <td className="board-td-num">3</td>
                  <td className="board-td-num">3</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">12</td>
                  <td className="board-td-pts">24</td>
                </tr>
                <tr className="board-rank-2">
                  <td className="board-td-rank board-td-rank-cell">🥈</td>
                  <td className="board-td-player">Sam Jones</td>
                  <td className="board-td-num">3</td>
                  <td className="board-td-num">2</td>
                  <td className="board-td-num">0</td>
                  <td className="board-td-num">1</td>
                  <td className="board-td-num">4</td>
                  <td className="board-td-pts">18</td>
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
                    Alex + Sam<span className="board-fixture-score">18</span>
                  </div>
                  <div className="board-fixture-vs">vs</div>
                  <div className="board-fixture-team">
                    Jordan + Taylor<span className="board-fixture-score">14</span>
                  </div>
                </div>
                <span className="board-fixture-check">✓</span>
              </div>
            </div>
          </div>
        </div>
        <div className="board-activity-feed">
          <span className="board-activity-dot" aria-hidden />
          Alex + Sam beat Jordan + Taylor 18-14 Court 1 just now
        </div>
        <div className="board-footer">Golden Point • First to 32 • Win 3 / Draw 1 / Loss 0</div>
      </div>
    )
  }

  return (
    <div className="matchplay-launcher" style={{ minHeight: '100vh' }}>
      <h1 className="matchplay-launcher-title">Matchplay</h1>
      <p style={{ color: 'var(--text-secondary)', padding: '0 1rem' }}>Unknown preview state — showing launcher.</p>
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
