'use client'

import type { GameMode } from '@/lib/types/match'
import SetupScreenHeader from './SetupScreenHeader'
import '@/app/styles/setup-form.css'

export interface MatchSetupFormProps {
  gameMode: GameMode
  setGameMode: (m: GameMode) => void
  setsToWin: 1 | 2
  setSetsToWin: (n: 1 | 2) => void
  players: string[]
  onPlayerChange: (index: number, value: string) => void
  onRandomize: () => void
  sideSwapEnabled: boolean
  setSideSwapEnabled: (v: boolean) => void
  endGameInTiebreak: boolean
  setEndGameInTiebreak: (v: boolean) => void
  onSubmit: () => void
  submitLoading: boolean
  submitLabel?: string
  error?: string | null
  showHeader?: boolean
}

export default function MatchSetupForm({
  gameMode,
  setGameMode,
  setsToWin,
  setSetsToWin,
  players,
  onPlayerChange,
  onRandomize,
  sideSwapEnabled,
  setSideSwapEnabled,
  endGameInTiebreak,
  setEndGameInTiebreak,
  onSubmit,
  submitLoading,
  submitLabel = 'START GAME',
  error,
  showHeader = true,
}: MatchSetupFormProps) {
  return (
    <div className="setup-screen">
      <div className="setup-screen-inner">
        {showHeader && <SetupScreenHeader />}

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
                <svg className="setup-mode-icon" viewBox="0 0 280 281" fill="none" aria-hidden>
                  <path d="M277.137 147.289C277.92 147.289 278.677 147.322 279.482 147.357C279.623 147.363 279.766 147.367 279.909 147.373C276.211 219.047 218.899 276.359 147.225 280.058C147.219 279.914 147.214 279.771 147.208 279.63C147.173 278.825 147.141 278.069 147.141 277.285C147.141 205.445 205.297 147.289 277.137 147.289Z" fill="currentColor" />
                  <path d="M146.986 0.239349C218.799 3.75729 276.39 61.3491 279.908 133.162C279.87 133.159 279.83 133.157 279.79 133.153C278.985 133.085 278.068 133.008 277.137 133.008C197.53 133.008 132.86 197.678 132.86 277.285C132.86 278.217 132.937 279.133 133.005 279.939C133.008 279.978 133.011 280.018 133.014 280.057C61.2007 276.539 3.60878 218.947 0.0910645 147.134C0.13026 147.137 0.170441 147.14 0.210205 147.144C1.01588 147.212 1.93229 147.289 2.86353 147.289C82.4706 147.289 147.141 82.6189 147.141 3.01181C147.141 2.08041 147.064 1.16427 146.995 0.35849C146.992 0.318576 146.989 0.278689 146.986 0.239349Z" fill="currentColor" />
                  <path d="M132.792 0.667084C132.827 1.47181 132.86 2.22846 132.86 3.01181C132.859 74.8521 74.7037 133.007 2.86353 133.008C2.08032 133.008 1.32335 132.975 0.518799 132.941C0.377499 132.934 0.233451 132.929 0.0891113 132.923C3.78765 61.2496 61.1013 3.93691 132.775 0.238373C132.781 0.382705 132.786 0.525791 132.792 0.667084Z" fill="currentColor" />
                </svg>
                <span className="setup-mode-name">Standard</span>
                <span className="setup-mode-desc">Classic</span>
              </button>
              <button
                type="button"
                className={`setup-mode-card ${gameMode === 'golden_point' ? 'active' : ''}`}
                onClick={() => setGameMode('golden_point')}
              >
                <svg className="setup-mode-icon" viewBox="0 0 280 281" fill="none" aria-hidden>
                  <path d="M277.137 147.289C277.92 147.289 278.677 147.322 279.482 147.357C279.623 147.363 279.766 147.367 279.909 147.373C276.211 219.047 218.899 276.359 147.225 280.058C147.219 279.914 147.214 279.771 147.208 279.63C147.173 278.825 147.141 278.069 147.141 277.285C147.141 205.445 205.297 147.289 277.137 147.289Z" fill="currentColor" />
                  <path d="M146.986 0.239349C218.799 3.75729 276.39 61.3491 279.908 133.162C279.87 133.159 279.83 133.157 279.79 133.153C278.985 133.085 278.068 133.008 277.137 133.008C197.53 133.008 132.86 197.678 132.86 277.285C132.86 278.217 132.937 279.133 133.005 279.939C133.008 279.978 133.011 280.018 133.014 280.057C61.2007 276.539 3.60878 218.947 0.0910645 147.134C0.13026 147.137 0.170441 147.14 0.210205 147.144C1.01588 147.212 1.93229 147.289 2.86353 147.289C82.4706 147.289 147.141 82.6189 147.141 3.01181C147.141 2.08041 147.064 1.16427 146.995 0.35849C146.992 0.318576 146.989 0.278689 146.986 0.239349Z" fill="currentColor" />
                  <path d="M132.792 0.667084C132.827 1.47181 132.86 2.22846 132.86 3.01181C132.859 74.8521 74.7037 133.007 2.86353 133.008C2.08032 133.008 1.32335 132.975 0.518799 132.941C0.377499 132.934 0.233451 132.929 0.0891113 132.923C3.78765 61.2496 61.1013 3.93691 132.775 0.238373C132.781 0.382705 132.786 0.525791 132.792 0.667084Z" fill="currentColor" />
                </svg>
                <span className="setup-mode-name">Golden</span>
                <span className="setup-mode-desc">No Adv.</span>
              </button>
              <button
                type="button"
                className={`setup-mode-card ${gameMode === 'silver_point' ? 'active' : ''}`}
                onClick={() => setGameMode('silver_point')}
              >
                <svg className="setup-mode-icon" viewBox="0 0 280 281" fill="none" aria-hidden>
                  <path d="M277.137 147.289C277.92 147.289 278.677 147.322 279.482 147.357C279.623 147.363 279.766 147.367 279.909 147.373C276.211 219.047 218.899 276.359 147.225 280.058C147.219 279.914 147.214 279.771 147.208 279.63C147.173 278.825 147.141 278.069 147.141 277.285C147.141 205.445 205.297 147.289 277.137 147.289Z" fill="currentColor" />
                  <path d="M146.986 0.239349C218.799 3.75729 276.39 61.3491 279.908 133.162C279.87 133.159 279.83 133.157 279.79 133.153C278.985 133.085 278.068 133.008 277.137 133.008C197.53 133.008 132.86 197.678 132.86 277.285C132.86 278.217 132.937 279.133 133.005 279.939C133.008 279.978 133.011 280.018 133.014 280.057C61.2007 276.539 3.60878 218.947 0.0910645 147.134C0.13026 147.137 0.170441 147.14 0.210205 147.144C1.01588 147.212 1.93229 147.289 2.86353 147.289C82.4706 147.289 147.141 82.6189 147.141 3.01181C147.141 2.08041 147.064 1.16427 146.995 0.35849C146.992 0.318576 146.989 0.278689 146.986 0.239349Z" fill="currentColor" />
                  <path d="M132.792 0.667084C132.827 1.47181 132.86 2.22846 132.86 3.01181C132.859 74.8521 74.7037 133.007 2.86353 133.008C2.08032 133.008 1.32335 132.975 0.518799 132.941C0.377499 132.934 0.233451 132.929 0.0891113 132.923C3.78765 61.2496 61.1013 3.93691 132.775 0.238373C132.781 0.382705 132.786 0.525791 132.792 0.667084Z" fill="currentColor" />
                </svg>
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
              <label className="setup-input-wrap">
                <span className="setup-input-icon" aria-hidden />
                <input
                  type="text"
                  className="setup-input"
                  placeholder="Player 1"
                  value={players[0] ?? ''}
                  onChange={(e) => onPlayerChange(0, e.target.value)}
                />
              </label>
              <label className="setup-input-wrap">
                <span className="setup-input-icon" aria-hidden />
                <input
                  type="text"
                  className="setup-input"
                  placeholder="Player 2"
                  value={players[1] ?? ''}
                  onChange={(e) => onPlayerChange(1, e.target.value)}
                />
              </label>
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
              <label className="setup-input-wrap">
                <span className="setup-input-icon" aria-hidden />
                <input
                  type="text"
                  className="setup-input"
                  placeholder="Player 3"
                  value={players[2] ?? ''}
                  onChange={(e) => onPlayerChange(2, e.target.value)}
                />
              </label>
              <label className="setup-input-wrap">
                <span className="setup-input-icon" aria-hidden />
                <input
                  type="text"
                  className="setup-input"
                  placeholder="Player 4"
                  value={players[3] ?? ''}
                  onChange={(e) => onPlayerChange(3, e.target.value)}
                />
              </label>
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
