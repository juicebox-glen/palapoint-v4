import Link from 'next/link'

export default function ScoresPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Score Displays</h1>
        <p>Score presentation across different screens</p>
      </header>

      <section className="ds-section">
        <h2>Spectator Live - Score Card</h2>
        <p>Full score row with photos, names, sets, games, points</p>

        <div className="ds-viewport-demo ds-viewport-demo--tv" style={{ padding: '2rem' }}>
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              borderLeft: '4px solid var(--team-a)',
              padding: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1.5rem',
            }}
          >
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <div
                style={{
                  width: '60px',
                  height: '70px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  border: '2px solid var(--team-a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--team-a)' }}>GN</span>
              </div>
              <div
                style={{
                  width: '60px',
                  height: '70px',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '6px',
                  border: '2px solid var(--team-a)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontWeight: 700, color: 'var(--team-a)' }}>RA</span>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>NOBLE</span>
                <span
                  style={{
                    width: '12px',
                    height: '12px',
                    background: '#D0FF14',
                    borderRadius: '50%',
                  }}
                />
              </div>
              <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>ANDERSON</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: 'var(--team-a)',
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  border: '2px solid var(--text-muted)',
                  opacity: 0.3,
                }}
              />
            </div>

            <div
              style={{
                fontSize: '4rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
                minWidth: '80px',
                textAlign: 'center',
              }}
            >
              2
            </div>

            <div
              style={{
                fontSize: '5rem',
                fontWeight: 700,
                color: 'var(--text-primary)',
                minWidth: '100px',
                textAlign: 'center',
                background: 'var(--bg-tertiary)',
                padding: '0.5rem 1rem',
                borderRadius: '0 8px 8px 0',
                margin: '-1rem -1rem -1rem 0',
              }}
            >
              15
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Score Typography</h2>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '5rem',
                  fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif',
                  lineHeight: 1,
                }}
              >
                40
              </div>
              <code>Points (TV)</code>
            </div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '4rem',
                  fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif',
                  lineHeight: 1,
                  color: 'var(--text-muted)',
                }}
              >
                6
              </div>
              <code>Games (TV)</code>
            </div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '2rem',
                  fontWeight: 700,
                  fontFamily: 'Space Grotesk, sans-serif',
                  lineHeight: 1,
                }}
              >
                AD
              </div>
              <code>Advantage</code>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Set Indicators</h2>
        <p>Dots showing sets won by each team</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: 'var(--team-a)',
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid var(--text-muted)',
                    opacity: 0.4,
                  }}
                />
                <div
                  style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: '2px solid var(--text-muted)',
                    opacity: 0.3,
                  }}
                />
              </div>
              <span style={{ marginLeft: '1rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Team A won 1 set
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Serve Indicator</h2>
        <p>Yellow/lime ball showing serving team</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <span
              className="spectator-live-serve"
              style={{
                width: '16px',
                height: '16px',
                background: '#D0FF14',
                borderRadius: '50%',
                display: 'inline-block',
                boxShadow: '0 0 10px rgba(208, 255, 20, 0.6), 0 0 20px rgba(208, 255, 20, 0.3)',
                animation: 'spectator-serve-pulse 1.5s ease-in-out infinite',
              }}
            />
            <span style={{ marginLeft: '0.75rem' }}>Serving</span>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Point Values</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Internal Value</th>
              <th>Display (Traditional)</th>
              <th>Display (Tiebreak)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>0</td>
              <td>0</td>
              <td>0</td>
            </tr>
            <tr>
              <td>1</td>
              <td>15</td>
              <td>1</td>
            </tr>
            <tr>
              <td>2</td>
              <td>30</td>
              <td>2</td>
            </tr>
            <tr>
              <td>3</td>
              <td>40</td>
              <td>3</td>
            </tr>
            <tr>
              <td>Deuce</td>
              <td>40-40</td>
              <td>—</td>
            </tr>
            <tr>
              <td>Advantage</td>
              <td>AD</td>
              <td>—</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
