import Link from 'next/link'

export default function MatchplayScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Social Matchplay</h1>
        <p>Tournament-style social sessions with automatic fixture generation (Americano, Mexicano formats)</p>
      </header>

      <section className="ds-section">
        <h2>Overview</h2>
        <p>
          Social matchplay replaces the traditional whiteboard-based Americano/Mexicano sessions at venues. Players are
          paired automatically, fixtures generated, and standings tracked digitally.
        </p>
      </section>

      <section className="ds-section">
        <h2>User Flow</h2>
        <div className="ds-flow-diagram">
          <div className="ds-flow-step">
            <span className="ds-flow-number">1</span>
            <span className="ds-flow-label">Launch</span>
            <span className="ds-flow-desc">Select format</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">2</span>
            <span className="ds-flow-label">Setup</span>
            <span className="ds-flow-desc">Add players</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">3</span>
            <span className="ds-flow-label">Fixtures</span>
            <span className="ds-flow-desc">Auto-generated rounds</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">4</span>
            <span className="ds-flow-label">Play</span>
            <span className="ds-flow-desc">Score each match</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">5</span>
            <span className="ds-flow-label">Standings</span>
            <span className="ds-flow-desc">Live leaderboard</span>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Screens</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Purpose</th>
              <th>Key Elements</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Launcher</td>
              <td>Entry point for social matchplay</td>
              <td>Format cards (Americano, Mexicano), Start button</td>
              <td>✅ Built</td>
            </tr>
            <tr>
              <td>Format Setup</td>
              <td>Configure session settings</td>
              <td>Player count, points per game, courts available</td>
              <td>✅ Built</td>
            </tr>
            <tr>
              <td>Player Entry</td>
              <td>Add players to session</td>
              <td>Player name inputs, photo capture (optional)</td>
              <td>✅ Built</td>
            </tr>
            <tr>
              <td>Fixtures/Rounds</td>
              <td>View generated pairings</td>
              <td>Round tabs, match cards with team assignments</td>
              <td>✅ Built</td>
            </tr>
            <tr>
              <td>Score Entry</td>
              <td>Enter match results</td>
              <td>Inline score inputs, save/submit</td>
              <td>✅ Built</td>
            </tr>
            <tr>
              <td>Standings</td>
              <td>Live leaderboard</td>
              <td>Ranked player list, points, games won/lost</td>
              <td>✅ Built</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Formats</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>Format</th>
              <th>Description</th>
              <th>Pairing Logic</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Americano</td>
              <td>Random rotating partners</td>
              <td>Each round pairs players randomly, ensuring everyone plays with different partners</td>
            </tr>
            <tr>
              <td>Mexicano</td>
              <td>Skill-based pairing</td>
              <td>After round 1, top scorers play together against next-highest pair</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Preview Routes Needed</h2>
        <div className="ds-note-block">
          <p>
            <strong>TODO:</strong> Create preview routes for matchplay screens:
          </p>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li>/design-system/preview/matchplay?state=launcher</li>
            <li>/design-system/preview/matchplay?state=setup</li>
            <li>/design-system/preview/matchplay?state=players</li>
            <li>/design-system/preview/matchplay?state=fixtures</li>
            <li>/design-system/preview/matchplay?state=scoring</li>
            <li>/design-system/preview/matchplay?state=standings</li>
          </ul>
        </div>
      </section>

      <section className="ds-section">
        <h2>Components Used</h2>
        <ul className="ds-component-list">
          <li>Format cards</li>
          <li>Player entry rows</li>
          <li>Round tabs</li>
          <li>Match cards</li>
          <li>Inline score inputs</li>
          <li>Standings table</li>
          <li>Progress indicators</li>
        </ul>
      </section>
    </div>
  )
}
