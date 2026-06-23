import Link from 'next/link'

export default function HeadersPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Headers</h1>
        <p>Page headers for different screen types</p>
      </header>

      <section className="ds-section">
        <h2>Spectator Display Header</h2>
        <p>Full-width header for TV displays (1920×1080). Idle omits the logo — it sits centered in the hero instead.</p>

        <div className="ds-viewport-demo ds-viewport-demo--tv" style={{ marginBottom: '1.5rem' }}>
          <div className="spectator-container spectator-container--idle" style={{ height: '280px', minHeight: '280px', padding: '1rem 1.5rem' }}>
            <div className="spectator-header" style={{ marginBottom: 0, justifyContent: 'flex-end' }}>
              <div className="spectator-header-badges">
                <div className="spectator-offline-badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                  <span className="spectator-offline-dot" style={{ width: '8px', height: '8px' }} aria-hidden />
                  <span>OFFLINE</span>
                </div>
                <div className="spectator-court-badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                  COURT 1
                </div>
              </div>
            </div>
            <div className="spectator-idle-hero" style={{ flex: 1 }}>
              <span style={{ fontSize: '2rem', fontWeight: 700 }}>VENUE LOGO</span>
            </div>
          </div>
          <p style={{ marginTop: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Idle — logo centered, OFFLINE + court top-right</p>
        </div>

        <div className="ds-viewport-demo ds-viewport-demo--tv">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '1rem 2rem',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>SQUARE</span>
              <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--team-a)' }}>ONE</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div className="spectator-ready-badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                <span className="spectator-ready-dot" style={{ width: '8px', height: '8px' }} aria-hidden />
                <span>READY</span>
              </div>
              <div className="spectator-court-badge" style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}>
                COURT 1
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Mobile Header</h2>
        <p>Compact header for mobile screens (375px)</p>

        <div className="ds-viewport-demo ds-viewport-demo--mobile">
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '1rem',
              background: 'var(--bg-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SQUARE</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--team-a)' }}>ONE</span>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Header Variants</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Logo Position</th>
              <th>Right Content</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spectator - Idle</td>
              <td>Centered (hero)</td>
              <td>OFFLINE + Court (header right)</td>
            </tr>
            <tr>
              <td>Spectator - Pregame</td>
              <td>Left</td>
              <td>READY + Court</td>
            </tr>
            <tr>
              <td>Spectator - Live</td>
              <td>Left</td>
              <td>LIVE + Court</td>
            </tr>
            <tr>
              <td>Spectator - Endgame</td>
              <td>Left</td>
              <td>FINAL + Court</td>
            </tr>
            <tr>
              <td>Control Panel</td>
              <td>Center</td>
              <td>—</td>
            </tr>
            <tr>
              <td>Setup/Playing</td>
              <td>Center</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
