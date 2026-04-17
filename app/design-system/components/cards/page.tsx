import Link from 'next/link'

export default function CardsPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Cards</h1>
        <p>Container patterns for grouping content</p>
      </header>

      <section className="ds-section">
        <h2>Spectator Live Card</h2>
        <p>Team score card with left border accent</p>

        <div className="ds-component-demo ds-component-demo--dark" style={{ maxWidth: '800px', padding: '2rem' }}>
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              borderLeft: '4px solid var(--team-a)',
              padding: '1.5rem',
              marginBottom: '1rem',
            }}
          >
            Team A Card Content
          </div>
          <div
            style={{
              background: 'var(--bg-secondary)',
              borderRadius: '12px',
              borderLeft: '4px solid var(--team-b)',
              padding: '1.5rem',
            }}
          >
            Team B Card Content
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Preview Card</h2>
        <p>Match preview container</p>

        <div className="ds-component-demo ds-component-demo--dark" style={{ maxWidth: '375px' }}>
          <div
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-default)',
              borderRadius: '12px',
              padding: '1.5rem',
            }}
          >
            Match preview content
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Card Patterns</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Background</th>
              <th>Border</th>
              <th>Radius</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Live Score Card</td>
              <td>
                <code>--bg-secondary</code>
              </td>
              <td>Left accent (team color)</td>
              <td>
                <code>--radius-lg</code>
              </td>
            </tr>
            <tr>
              <td>Preview Card</td>
              <td>
                <code>--bg-secondary</code>
              </td>
              <td>
                1px <code>--border-default</code>
              </td>
              <td>
                <code>--radius-lg</code>
              </td>
            </tr>
            <tr>
              <td>Setup Card</td>
              <td>
                <code>--bg-secondary</code>
              </td>
              <td>
                1px <code>--border-default</code>
              </td>
              <td>
                <code>--radius-lg</code>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
