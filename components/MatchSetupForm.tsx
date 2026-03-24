'use client'

import type { GameMode, PlayerPhotosState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import SetupScreenHeader from './SetupScreenHeader'
import PlayerPhotoCapture from '@/components/ui/PlayerPhotoCapture'
import '@/app/styles/setup-form.css'

export interface MatchSetupFormProps {
  gameMode: GameMode
  setGameMode: (m: GameMode) => void
  setsToWin: 1 | 2
  setSetsToWin: (n: 1 | 2) => void
  players: string[]
  onPlayerChange: (index: number, value: string) => void
  onRandomize: () => void
  tempMatchId: string
  playerPhotos: PlayerPhotosState
  onPlayerPhotoChange: (key: keyof PlayerPhotosState, url: string | null) => void
  sideSwapEnabled: boolean
  setSideSwapEnabled: (v: boolean) => void
  endGameInTiebreak: boolean
  setEndGameInTiebreak: (v: boolean) => void
  onSubmit: () => void
  submitLoading: boolean
  submitLabel?: string
  error?: string | null
  showHeader?: boolean
  branding?: VenueBranding | null
}

export default function MatchSetupForm({
  gameMode,
  setGameMode,
  setsToWin,
  setSetsToWin,
  players,
  onPlayerChange,
  onRandomize,
  tempMatchId,
  playerPhotos,
  onPlayerPhotoChange,
  sideSwapEnabled,
  setSideSwapEnabled,
  endGameInTiebreak,
  setEndGameInTiebreak,
  onSubmit,
  submitLoading,
  submitLabel = 'START GAME',
  error,
  showHeader = true,
  branding,
}: MatchSetupFormProps) {
  return (
    <div className="setup-screen">
      <div className="setup-screen-inner">
        {showHeader && <SetupScreenHeader branding={branding} />}

        {error && <div className="setup-error">{error}</div>}

        <div className="setup-form">
          <section className="setup-section">
            <h2 className="setup-section-title">POINT MODE</h2>
            <div className="setup-mode-cards">
              <button
                type="button"
                className={`setup-mode-card ${gameMode === 'traditional' ? 'active' : ''}`}
                onClick={() => setGameMode('traditional')}
              >
                <img
                  src="/images/settings-ball.svg"
                  alt=""
                  className="setup-mode-icon"
                  width={44}
                  height={44}
                  aria-hidden
                />
                <span className="setup-mode-name">Standard</span>
                <span className="setup-mode-desc">Classic</span>
              </button>
              <button
                type="button"
                className={`setup-mode-card ${gameMode === 'golden_point' ? 'active' : ''}`}
                onClick={() => setGameMode('golden_point')}
              >
                <img
                  src="/images/settings-ball.svg"
                  alt=""
                  className="setup-mode-icon"
                  width={44}
                  height={44}
                  aria-hidden
                />
                <span className="setup-mode-name">Golden</span>
                <span className="setup-mode-desc">No Adv.</span>
              </button>
              <button
                type="button"
                className={`setup-mode-card ${gameMode === 'silver_point' ? 'active' : ''}`}
                onClick={() => setGameMode('silver_point')}
              >
                <img
                  src="/images/settings-ball.svg"
                  alt=""
                  className="setup-mode-icon"
                  width={44}
                  height={44}
                  aria-hidden
                />
                <span className="setup-mode-name">Silver</span>
                <span className="setup-mode-desc">1 Adv.</span>
              </button>
            </div>
          </section>

          <section className="setup-section">
            <h2 className="setup-section-title">NUMBER OF SETS</h2>
            <div className="setup-sets-row">
              <button
                type="button"
                className={`setup-sets-pill ${setsToWin === 1 ? 'active' : ''}`}
                onClick={() => setSetsToWin(1)}
              >
                1 Set
              </button>
              <button
                type="button"
                className={`setup-sets-pill ${setsToWin === 2 ? 'active' : ''}`}
                onClick={() => setSetsToWin(2)}
              >
                3 Sets
              </button>
            </div>
          </section>

          <section className="setup-section setup-toggles">
            <div className="setup-toggle-row">
              <span className="setup-toggle-label">END GAME IN TIEBREAK</span>
              <button
                type="button"
                role="switch"
                aria-checked={endGameInTiebreak}
                className={`setup-switch ${endGameInTiebreak ? 'on' : ''}`}
                onClick={() => setEndGameInTiebreak(!endGameInTiebreak)}
              >
                <span className="setup-switch-knob" />
              </button>
            </div>
            <div className="setup-toggle-row">
              <span className="setup-toggle-label">SWAP SIDES</span>
              <button
                type="button"
                role="switch"
                aria-checked={sideSwapEnabled}
                className={`setup-switch ${sideSwapEnabled ? 'on' : ''}`}
                onClick={() => setSideSwapEnabled(!sideSwapEnabled)}
              >
                <span className="setup-switch-knob" />
              </button>
            </div>
          </section>

          {/* Players: one card — Team A, RANDOMIZE (splits), Team B */}
          <section className="setup-section setup-section-players">
            <h2 className="setup-section-title setup-team-title">
              <span className="setup-team-dot setup-team-dot-a" />
              TEAM A
            </h2>
            <div className="setup-inputs">
              <div className="setup-player-row">
                <PlayerPhotoCapture
                  playerId="team_a_player_1"
                  matchId={tempMatchId}
                  currentPhotoUrl={playerPhotos.team_a_player_1_photo}
                  onPhotoChange={(url) => onPlayerPhotoChange('team_a_player_1_photo', url)}
                />
                <div className="setup-input-wrap setup-input-wrap--player-name">
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="Player 1"
                    value={players[0] ?? ''}
                    onChange={(e) => onPlayerChange(0, e.target.value)}
                  />
                </div>
              </div>
              <div className="setup-player-row">
                <PlayerPhotoCapture
                  playerId="team_a_player_2"
                  matchId={tempMatchId}
                  currentPhotoUrl={playerPhotos.team_a_player_2_photo}
                  onPhotoChange={(url) => onPlayerPhotoChange('team_a_player_2_photo', url)}
                />
                <div className="setup-input-wrap setup-input-wrap--player-name">
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="Player 2"
                    value={players[1] ?? ''}
                    onChange={(e) => onPlayerChange(1, e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="setup-randomize-wrap">
              <span className="setup-randomize-line" />
              <button
                type="button"
                className={`setup-randomize-btn ${players.some((p) => (p ?? '').trim() !== '') ? 'active' : ''}`}
                onClick={onRandomize}
              >
                <svg className="setup-randomize-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
                </svg>
                RANDOMIZE
              </button>
              <span className="setup-randomize-line" />
            </div>

            <h2 className="setup-section-title setup-team-title setup-team-title-b">
              <span className="setup-team-dot setup-team-dot-b" />
              TEAM B
            </h2>
            <div className="setup-inputs">
              <div className="setup-player-row">
                <PlayerPhotoCapture
                  playerId="team_b_player_1"
                  matchId={tempMatchId}
                  currentPhotoUrl={playerPhotos.team_b_player_1_photo}
                  onPhotoChange={(url) => onPlayerPhotoChange('team_b_player_1_photo', url)}
                />
                <div className="setup-input-wrap setup-input-wrap--player-name">
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="Player 3"
                    value={players[2] ?? ''}
                    onChange={(e) => onPlayerChange(2, e.target.value)}
                  />
                </div>
              </div>
              <div className="setup-player-row">
                <PlayerPhotoCapture
                  playerId="team_b_player_2"
                  matchId={tempMatchId}
                  currentPhotoUrl={playerPhotos.team_b_player_2_photo}
                  onPhotoChange={(url) => onPlayerPhotoChange('team_b_player_2_photo', url)}
                />
                <div className="setup-input-wrap setup-input-wrap--player-name">
                  <input
                    type="text"
                    className="setup-input"
                    placeholder="Player 4"
                    value={players[3] ?? ''}
                    onChange={(e) => onPlayerChange(3, e.target.value)}
                  />
                </div>
              </div>
            </div>
          </section>

          <button
            type="button"
            className="setup-submit-btn"
            onClick={onSubmit}
            disabled={submitLoading}
          >
            {submitLoading ? 'Starting...' : submitLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
