import Link from 'next/link'

export default function BadgesPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Badges</h1>
        <p>Status indicators and labels</p>
      </header>

      <section className="ds-section">
        <h2>Spectator Status Badges</h2>
        <p>Used in spectator display header to show match state</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div className="spectator-ready-badge">
              <span className="spectator-ready-dot" aria-hidden />
              <span>READY</span>
            </div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div
              className="spectator-container--live"
              style={{
                padding: '0.75rem 1rem',
                background: 'var(--bg-primary)',
                minHeight: 0,
                isolation: 'isolate',
              }}
            >
              <div className="spectator-header-badges">
                <div className="spectator-live-badge">
                  <span className="spectator-live-dot" aria-hidden />
                  <span>LIVE</span>
                </div>
              </div>
            </div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div className="spectator-final-badge">
              <span className="spectator-final-dot" aria-hidden />
              <span>FINAL</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Court Badge</h2>
        <p>Shows court name/number</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div className="spectator-court-badge">COURT 1</div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div className="spectator-court-badge">Show Court 1</div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Mode Badges</h2>
        <p>Game mode and set count indicators</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="spectator-pregame-badge">1 SET</span>
              <span className="spectator-pregame-badge">TRADITIONAL</span>
            </div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <span className="spectator-pregame-badge">3 SETS</span>
              <span className="spectator-pregame-badge">GOLDEN</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Preview Badge</h2>
        <p>Staff control preview state</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <span className="preview-badge">PREVIEW</span>
          </div>
        </div>
      </section>
    </div>
  )
}
