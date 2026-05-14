'use client'

import '@/app/styles/matchplay.css'
import { CourtIcon } from '@/components/matchplay/CourtIcon'
import '@/app/styles/matchplay-board.css'
import '@/app/styles/setup-form.css'
import { BoardStandings, type BoardStandingsPlayer } from '@/components/matchplay/BoardStandings'
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
    standings: 'hub_standings',
    standings_tv: 'board_live',
    roster: 'hub_players',
    hub_roster: 'hub_players',
    edit_players: 'hub_players',
  }
  return aliases[raw] ?? raw
}

/** Ranked rows — mirrors `/matchplay/[id]/standings` and `/results` list styling. */
const DS_HUB_STANDINGS_RANKED: {
  id: string
  name: string
  rank: number
  total_points: number
  game_difference: number
}[] = [
  { id: 'ds-r1', name: 'Glen Noble', rank: 1, total_points: 95, game_difference: 24 },
  { id: 'ds-r2', name: 'Julian Waters', rank: 2, total_points: 82, game_difference: 10 },
  { id: 'ds-r3', name: 'Rob Anderson', rank: 3, total_points: 71, game_difference: 4 },
  { id: 'ds-r4', name: 'Carl Pettit', rank: 4, total_points: 58, game_difference: -6 },
  { id: 'ds-r5', name: 'Sam Wilson', rank: 5, total_points: 52, game_difference: -8 },
  { id: 'ds-r6', name: 'Jake Thomas', rank: 6, total_points: 46, game_difference: -10 },
  { id: 'ds-r7', name: 'Mike Brown', rank: 7, total_points: 40, game_difference: -12 },
  { id: 'ds-r8', name: 'Tom Davis', rank: 8, total_points: 34, game_difference: -14 },
]

/** Static standings rows — keep in sync with TV board `/matchplay/[id]/board` previews. */
const DS_BOARD_LIVE_STANDINGS: BoardStandingsPlayer[] = [
  { id: 'ds-live-1', name: 'Glen Noble', total_points: 38, game_difference: 12 },
  { id: 'ds-live-2', name: 'Julian Waters', total_points: 38, game_difference: 12 },
  { id: 'ds-live-3', name: 'Rob Anderson', total_points: 30, game_difference: 2 },
  { id: 'ds-live-4', name: 'Carl Pettit', total_points: 28, game_difference: -2 },
]

const DS_BOARD_LIVE_RESTING: BoardStandingsPlayer[] = [
  { id: 'ds-live-rest', name: 'Alex Chen', total_points: 22, game_difference: -4 },
]

const DS_BOARD_COMPLETED_STANDINGS: BoardStandingsPlayer[] = [
  {
    id: 'ds-fin-1',
    name: 'Glen Noble',
    total_points: 95,
    game_difference: 24,
    matches_played: 5,
    matches_won: 5,
    matches_drawn: 0,
    matches_lost: 0,
  },
  {
    id: 'ds-fin-2',
    name: 'Julian Waters',
    total_points: 82,
    game_difference: 10,
    matches_played: 5,
    matches_won: 4,
    matches_drawn: 0,
    matches_lost: 1,
  },
  {
    id: 'ds-fin-3',
    name: 'Rob Anderson',
    total_points: 71,
    game_difference: 4,
    matches_played: 5,
    matches_won: 3,
    matches_drawn: 1,
    matches_lost: 1,
  },
  {
    id: 'ds-fin-4',
    name: 'Carl Pettit',
    total_points: 58,
    game_difference: -6,
    matches_played: 5,
    matches_won: 2,
    matches_drawn: 0,
    matches_lost: 3,
  },
]

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

/** Event hub scoring UI — shared by `event` and `event_finalize` previews. */
function MatchplayDsEventHubPreview({ footerCta }: { footerCta: string }) {
  return (
    <div className="matchplay-event-page" style={{ minHeight: '100vh' }}>
      <header className="matchplay-hub-header">
        <span className="matchplay-hub-back" aria-hidden>
          ←
        </span>
        <h1 className="matchplay-hub-title">Event</h1>
        <div className="matchplay-hub-menu-container">
          <span className="matchplay-hub-menu-btn" aria-hidden style={{ pointerEvents: 'none' }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2" />
              <circle cx="12" cy="12" r="2" />
              <circle cx="12" cy="19" r="2" />
            </svg>
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
        <button type="button" className="matchplay-hub-round-tab">
          ROUND 3
        </button>
        <button type="button" className="matchplay-hub-round-tab">
          ROUND 4
        </button>
      </nav>
      <div className="matchplay-hub-matches">
        <div className="matchplay-hub-match matchplay-card matchplay-hub-match--completed">
          <div className="matchplay-hub-match-compact">
            <div className="matchplay-hub-match-side matchplay-hub-match-side--a">
              <div className="matchplay-hub-match-score-row">
                <div className="matchplay-hub-match-score">
                  <span className="matchplay-hub-match-score-num">18</span>
                </div>
              </div>
              <div className="matchplay-hub-match-names">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Glen Noble', 'abbreviated')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Rob Anderson', 'abbreviated')}</span>
              </div>
            </div>
            <div className="matchplay-hub-match-vs-column">
              <div className="matchplay-hub-match-vs-wrap">
                <span className="matchplay-hub-match-vs-badge">VS</span>
                <span className="matchplay-hub-match-court">Court 1</span>
              </div>
            </div>
            <div className="matchplay-hub-match-side matchplay-hub-match-side--b">
              <div className="matchplay-hub-match-score-row">
                <div className="matchplay-hub-match-score">
                  <span className="matchplay-hub-match-score-num">14</span>
                </div>
              </div>
              <div className="matchplay-hub-match-names">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Julian Waters', 'abbreviated')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Carl Pettit', 'abbreviated')}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="matchplay-hub-match matchplay-card matchplay-hub-match--pending matchplay-hub-match--expanded">
          <div className="matchplay-hub-match-compact">
            <div className="matchplay-hub-match-side matchplay-hub-match-side--a">
              <div className="matchplay-hub-match-score-row">
                <div className="matchplay-hub-match-score">
                  <span className="matchplay-hub-match-score-num">0</span>
                </div>
              </div>
              <div className="matchplay-hub-match-names">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Sam Wilson', 'abbreviated')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Jake Thomas', 'abbreviated')}</span>
              </div>
            </div>
            <div className="matchplay-hub-match-vs-column">
              <div className="matchplay-hub-match-vs-wrap">
                <span className="matchplay-hub-match-vs-badge">VS</span>
                <span className="matchplay-hub-match-court">Court 2</span>
              </div>
            </div>
            <div className="matchplay-hub-match-side matchplay-hub-match-side--b">
              <div className="matchplay-hub-match-score-row">
                <div className="matchplay-hub-match-score">
                  <span className="matchplay-hub-match-score-num">0</span>
                </div>
              </div>
              <div className="matchplay-hub-match-names">
                <span className="matchplay-hub-match-surname">{formatPlayerName('Mike Brown', 'abbreviated')}</span>
                <span className="matchplay-hub-match-surname">{formatPlayerName('Tom Davis', 'abbreviated')}</span>
              </div>
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
              <span className="btn btn--secondary btn--full" style={{ pointerEvents: 'none' }}>
                CANCEL
              </span>
              <span className="btn btn--primary btn--full" style={{ pointerEvents: 'none' }}>
                CONFIRM
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
        <span className="btn btn--primary btn--full" style={{ pointerEvents: 'none' }}>
          {footerCta}
        </span>
      </footer>
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
      { name: 'Rob Anderson', hasPhoto: true },
      { name: 'Julian Waters' },
      { name: 'Carl Pettit' },
      { name: 'Sam Wilson' },
      { name: 'Jake Thomas' },
      { name: 'Mike Brown' },
      { name: 'Alex Chen' },
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
          <span className="matchplay-btn-primary" style={{ pointerEvents: 'none', display: 'block', textAlign: 'center' }}>
            Start Event
          </span>
        </footer>
      </div>
    )
  }

  if (s === 'event') {
    return <MatchplayDsEventHubPreview footerCta="NEXT ROUND" />
  }

  if (s === 'event_finalize') {
    return <MatchplayDsEventHubPreview footerCta="FINALIZE RESULTS" />
  }

  if (s === 'hub_players') {
    const rosterSlots = DS_HUB_STANDINGS_RANKED.map((p, i) => ({
      name: p.name,
      hasPhoto: i < 2,
    }))
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
                <span className="matchplay-card-label">Players</span>
                <span className="matchplay-card-label-count">{rosterSlots.length}</span>
              </div>
              <div className="setup-inputs">
                {rosterSlots.map((slot, index) => (
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
            Save Changes
          </span>
        </footer>
      </div>
    )
  }

  if (s === 'hub_standings') {
    return (
      <div className="matchplay-page matchplay-page--setup" style={{ minHeight: '100vh' }}>
        <header className="matchplay-page-header">
          <span className="matchplay-back-btn">← Back</span>
          <h1 className="matchplay-page-title">Standings</h1>
          <span className="matchplay-page-header-spacer" aria-hidden />
        </header>

        <div className="matchplay-setup-inner matchplay-standings-content">
          <div className="matchplay-standings-list">
            {DS_HUB_STANDINGS_RANKED.map((player) => {
              const rank = player.rank
              const isTopThree = rank <= 3

              return (
                <div
                  key={player.id}
                  className={`matchplay-standings-row ${isTopThree ? `matchplay-standings-row--rank-${rank}` : ''}`}
                >
                  <div className="matchplay-standings-rank">
                    {rank === 1 && <span className="matchplay-standings-medal">🏆</span>}
                    {rank === 2 && <span className="matchplay-standings-medal">🥈</span>}
                    {rank === 3 && <span className="matchplay-standings-medal">🥉</span>}
                    {rank > 3 && <span className="matchplay-standings-rank-num">{rank}</span>}
                  </div>

                  <div className="matchplay-standings-avatar">
                    <span className="matchplay-standings-initials">{getPlayerInitials(player.name)}</span>
                  </div>

                  <div className="matchplay-standings-info">
                    <span className="matchplay-standings-name">{formatPlayerName(player.name, 'full')}</span>
                    <span className="matchplay-standings-stats">
                      {player.total_points} pts
                      <span
                        className={`matchplay-standings-diff ${player.game_difference >= 0 ? 'matchplay-standings-diff--positive' : 'matchplay-standings-diff--negative'}`}
                      >
                        {player.game_difference >= 0 ? '+' : ''}
                        {player.game_difference}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  if (s === 'hub_results') {
    const leaders = DS_HUB_STANDINGS_RANKED.filter((row) => row.rank === 1)
    const winnerNamesJoined = leaders.map((l) => l.name).join(' & ')
    const winnerPts = leaders[0]?.total_points ?? 0
    const winnerGd = leaders[0]?.game_difference ?? 0
    const gdSigned = `${winnerGd >= 0 ? '+' : ''}${winnerGd}`

    return (
      <div className="matchplay-page matchplay-page--setup matchplay-results-page" style={{ minHeight: '100vh' }}>
        <header className="matchplay-results-header">
          <h1 className="matchplay-results-title">Event complete</h1>
          <p className="matchplay-results-subtitle">8 players · 7 of 7 rounds</p>
        </header>

        {leaders.length > 0 ? (
          <div className="matchplay-results-winner">
            <span className="matchplay-results-trophy" aria-hidden>
              🏆
            </span>
            <div className="matchplay-results-winner-avatar">
              <span className="matchplay-results-winner-initials">{getPlayerInitials(winnerNamesJoined)}</span>
            </div>
            <h2 className="matchplay-results-winner-name">{formatPlayerName(winnerNamesJoined, 'full')}</h2>
            <p className="matchplay-results-winner-stats">
              {winnerPts} pts · GD {gdSigned}
            </p>
          </div>
        ) : null}

        <div className="matchplay-results-standings">
          <h3 className="matchplay-results-standings-title">Final standings</h3>
          <div className="matchplay-standings-list">
            {DS_HUB_STANDINGS_RANKED.map((player) => {
              const rank = player.rank
              const isTopThree = rank <= 3

              return (
                <div
                  key={player.id}
                  className={`matchplay-standings-row ${isTopThree ? `matchplay-standings-row--rank-${rank}` : ''}`}
                >
                  <div className="matchplay-standings-rank">
                    {rank === 1 && <span className="matchplay-standings-medal">🏆</span>}
                    {rank === 2 && <span className="matchplay-standings-medal">🥈</span>}
                    {rank === 3 && <span className="matchplay-standings-medal">🥉</span>}
                    {rank > 3 && <span className="matchplay-standings-rank-num">{rank}</span>}
                  </div>

                  <div className="matchplay-standings-avatar">
                    <span className="matchplay-standings-initials">{getPlayerInitials(player.name)}</span>
                  </div>

                  <div className="matchplay-standings-info">
                    <span className="matchplay-standings-name">{formatPlayerName(player.name, 'full')}</span>
                    <span className="matchplay-standings-stats">
                      {player.total_points} pts
                      <span
                        className={`matchplay-standings-diff ${player.game_difference >= 0 ? 'matchplay-standings-diff--positive' : 'matchplay-standings-diff--negative'}`}
                      >
                        {player.game_difference >= 0 ? '+' : ''}
                        {player.game_difference}
                      </span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <footer className="matchplay-results-footer">
          <div className="matchplay-results-footer-actions">
            <span className="btn btn--secondary btn--full" style={{ pointerEvents: 'none', display: 'block', textAlign: 'center' }}>
              Detailed standings
            </span>
            <span className="btn btn--primary btn--full" style={{ pointerEvents: 'none', display: 'block', textAlign: 'center' }}>
              Start new event
            </span>
          </div>
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
          <div className="board-panel board-standings board-panel--standings">
            <BoardStandings mode="setup" standings={[]} />
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
          <div className="board-panel board-standings board-panel--standings">
            <BoardStandings mode="live" standings={DS_BOARD_LIVE_STANDINGS} restingPlayers={DS_BOARD_LIVE_RESTING} />
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
            <BoardStandings mode="completed" standings={DS_BOARD_COMPLETED_STANDINGS} title="FINAL STANDINGS" size="hero" />
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
          ?state=
          launcher|format|players|event|event_finalize|hub_players|hub_standings|hub_results|board_setup|board_live|board_completed
        </code>
        . Aliases: <code>setup</code> → format; <code>fixtures|scoring</code> → event hub; <code>standings</code> → staff
        standings screen; <code>roster|hub_roster|edit_players</code> → roster edit (
        <code>/matchplay/[id]/players</code>).
      </p>
      <MatchplayLauncherModePicker />
    </div>
  )
}
