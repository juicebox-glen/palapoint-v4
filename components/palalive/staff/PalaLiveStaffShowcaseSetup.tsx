import PlayerPhotoCapture from '@/components/ui/PlayerPhotoCapture'
import type { GameMode, PlayerPhotosState } from '@/lib/types/match'

export interface PalaLiveStaffShowcaseSetupProps {
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
}

const MODE_OPTIONS: Array<{ value: GameMode; name: string; desc: string }> = [
  { value: 'traditional', name: 'Standard', desc: 'Classic' },
  { value: 'golden_point', name: 'Golden', desc: 'No Adv.' },
  { value: 'silver_point', name: 'Silver', desc: '1 Adv.' },
]

export function PalaLiveStaffShowcaseSetup({
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
  submitLabel = 'Continue',
  error,
}: PalaLiveStaffShowcaseSetupProps) {
  return (
    <div className="palalive-staff-body">
      {error ? <p className="palalive-staff-error">{error}</p> : null}

      <div className="palalive-staff-card">
        <h2 className="palalive-staff-card-label">Point Mode</h2>
        <div className="palalive-staff-mode-cards">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`palalive-staff-mode-card ${gameMode === opt.value ? 'is-active' : ''}`}
              onClick={() => setGameMode(opt.value)}
            >
              <img src="/images/settings-ball.svg" alt="" className="palalive-staff-mode-icon" width={28} height={28} aria-hidden />
              <span className="palalive-staff-mode-name">{opt.name}</span>
              <span className="palalive-staff-mode-desc">{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="palalive-staff-card">
        <h2 className="palalive-staff-card-label">Number of Sets</h2>
        <div className="palalive-staff-pill-row">
          <button
            type="button"
            className={`palalive-staff-pill ${setsToWin === 1 ? 'is-active' : ''}`}
            onClick={() => setSetsToWin(1)}
          >
            1 Set
          </button>
          <button
            type="button"
            className={`palalive-staff-pill ${setsToWin === 2 ? 'is-active' : ''}`}
            onClick={() => setSetsToWin(2)}
          >
            3 Sets
          </button>
        </div>
      </div>

      <div className="palalive-staff-card">
        <div className="palalive-staff-toggle-row">
          <span className="palalive-staff-toggle-label">End Game in Tiebreak</span>
          <button
            type="button"
            role="switch"
            aria-checked={endGameInTiebreak}
            className={`palalive-staff-switch ${endGameInTiebreak ? 'is-on' : ''}`}
            onClick={() => setEndGameInTiebreak(!endGameInTiebreak)}
          >
            <span className="palalive-staff-switch-knob" />
          </button>
        </div>
        <div className="palalive-staff-toggle-row">
          <span className="palalive-staff-toggle-label">Swap Sides</span>
          <button
            type="button"
            role="switch"
            aria-checked={sideSwapEnabled}
            className={`palalive-staff-switch ${sideSwapEnabled ? 'is-on' : ''}`}
            onClick={() => setSideSwapEnabled(!sideSwapEnabled)}
          >
            <span className="palalive-staff-switch-knob" />
          </button>
        </div>
      </div>

      <div className="palalive-staff-card">
        <h2 className="palalive-staff-team-title">
          <span className="palalive-staff-team-dot team-a" />
          Team A
        </h2>
        <div className="palalive-staff-player-row">
          <PlayerPhotoCapture
            playerId="team_a_player_1"
            matchId={tempMatchId}
            currentPhotoUrl={playerPhotos.team_a_player_1_photo}
            onPhotoChange={(url) => onPlayerPhotoChange('team_a_player_1_photo', url)}
          />
          <input
            type="text"
            className="palalive-staff-player-input"
            placeholder="Player 1"
            value={players[0] ?? ''}
            onChange={(e) => onPlayerChange(0, e.target.value)}
          />
        </div>
        <div className="palalive-staff-player-row">
          <PlayerPhotoCapture
            playerId="team_a_player_2"
            matchId={tempMatchId}
            currentPhotoUrl={playerPhotos.team_a_player_2_photo}
            onPhotoChange={(url) => onPlayerPhotoChange('team_a_player_2_photo', url)}
          />
          <input
            type="text"
            className="palalive-staff-player-input"
            placeholder="Player 2"
            value={players[1] ?? ''}
            onChange={(e) => onPlayerChange(1, e.target.value)}
          />
        </div>

        <div className="palalive-staff-randomize-wrap">
          <button type="button" className="palalive-staff-randomize-btn" onClick={onRandomize}>
            <svg className="palalive-staff-randomize-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M16 3h5v5M4 20L21 3M21 16v5h-5M15 15l6 6M4 4l5 5" />
            </svg>
            Randomize
          </button>
        </div>

        <h2 className="palalive-staff-team-title">
          <span className="palalive-staff-team-dot team-b" />
          Team B
        </h2>
        <div className="palalive-staff-player-row">
          <PlayerPhotoCapture
            playerId="team_b_player_1"
            matchId={tempMatchId}
            currentPhotoUrl={playerPhotos.team_b_player_1_photo}
            onPhotoChange={(url) => onPlayerPhotoChange('team_b_player_1_photo', url)}
          />
          <input
            type="text"
            className="palalive-staff-player-input"
            placeholder="Player 3"
            value={players[2] ?? ''}
            onChange={(e) => onPlayerChange(2, e.target.value)}
          />
        </div>
        <div className="palalive-staff-player-row">
          <PlayerPhotoCapture
            playerId="team_b_player_2"
            matchId={tempMatchId}
            currentPhotoUrl={playerPhotos.team_b_player_2_photo}
            onPhotoChange={(url) => onPlayerPhotoChange('team_b_player_2_photo', url)}
          />
          <input
            type="text"
            className="palalive-staff-player-input"
            placeholder="Player 4"
            value={players[3] ?? ''}
            onChange={(e) => onPlayerChange(3, e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className="palalive-staff-btn palalive-staff-btn--primary"
        onClick={onSubmit}
        disabled={submitLoading}
      >
        {submitLoading ? '…' : submitLabel}
      </button>
    </div>
  )
}
