import Link from 'next/link'

const cssArchitectureExample = `/* TV Display base */
.spectator-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
}

.spectator-header { /* Fixed top */ }
.spectator-*-broadcast { /* Flex: 1, centered content */ }
.spectator-pregame-badges { /* Absolute bottom-left */ }

/* Mobile Stack base */
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.page-header { /* Logo area */ }
.page-content { /* Flex: 1, scrollable */ }
.page-actions { /* Sticky bottom */ }`

export default function LayoutsPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Page Layouts</h1>
        <p>Common structural patterns used across screens</p>
      </header>

      <section className="ds-section">
        <h2>Layout Patterns</h2>

        <div className="ds-layout-grid">
          <div className="ds-layout-card">
            <h3>TV Display Layout</h3>
            <p>Full-screen layout for spectator and court displays</p>

            <div className="ds-layout-diagram ds-layout-diagram--tv">
              <div className="ds-layout-zone ds-layout-zone--header">Header (Logo + Badges)</div>
              <div className="ds-layout-zone ds-layout-zone--main">Main Content Area</div>
              <div className="ds-layout-zone ds-layout-zone--footer">Footer Badges (optional)</div>
            </div>

            <div className="ds-layout-specs">
              <p>
                <strong>Viewport:</strong> 1920 × 1080
              </p>
              <p>
                <strong>Used by:</strong> Spectator Display, Court Display
              </p>
              <p>
                <strong>Background:</strong> GradientWaveDrift or solid
              </p>
            </div>
          </div>

          <div className="ds-layout-card">
            <h3>Mobile Stack Layout</h3>
            <p>Vertical stack with header and bottom actions</p>

            <div className="ds-layout-diagram ds-layout-diagram--mobile">
              <div className="ds-layout-zone ds-layout-zone--header">Header (Logo centered)</div>
              <div className="ds-layout-zone ds-layout-zone--main">Scrollable Content</div>
              <div className="ds-layout-zone ds-layout-zone--actions">Fixed Actions</div>
            </div>

            <div className="ds-layout-specs">
              <p>
                <strong>Viewport:</strong> 375px width
              </p>
              <p>
                <strong>Used by:</strong> Control Panel, Player Setup, Player Playing
              </p>
              <p>
                <strong>Actions:</strong> Sticky to bottom
              </p>
            </div>
          </div>

          <div className="ds-layout-card">
            <h3>Preview Layout</h3>
            <p>Centered content with status and actions</p>

            <div className="ds-layout-diagram ds-layout-diagram--mobile">
              <div className="ds-layout-zone ds-layout-zone--status">Status Bar (READY + Court)</div>
              <div className="ds-layout-zone ds-layout-zone--card">Preview Card</div>
              <div className="ds-layout-zone ds-layout-zone--badges">Mode Badges</div>
              <div className="ds-layout-zone ds-layout-zone--actions">Actions</div>
            </div>

            <div className="ds-layout-specs">
              <p>
                <strong>Viewport:</strong> Mobile
              </p>
              <p>
                <strong>Used by:</strong> Control Preview, End Game
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Shared Regions</h2>
        <p>Components that appear in the same position across multiple screens</p>

        <table className="ds-table">
          <thead>
            <tr>
              <th>Region</th>
              <th>TV Displays</th>
              <th>Mobile</th>
              <th>Component</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Header</td>
              <td>Logo left, badges right</td>
              <td>Logo centered</td>
              <td>
                <code>SpectatorHeader</code>, <code>Header</code>
              </td>
            </tr>
            <tr>
              <td>Status Badge</td>
              <td>READY / LIVE / FINAL in header</td>
              <td>Above content or in header</td>
              <td>Shared badge styles</td>
            </tr>
            <tr>
              <td>Mode Badges</td>
              <td>Bottom left corner</td>
              <td>Below main content</td>
              <td>
                <code>.spectator-pregame-badge</code>
              </td>
            </tr>
            <tr>
              <td>Actions</td>
              <td>N/A</td>
              <td>Bottom, full-width buttons</td>
              <td>
                <code>.preview-btn</code>
              </td>
            </tr>
            <tr>
              <td>Team Display</td>
              <td>Side-by-side with VS</td>
              <td>Stacked or side-by-side</td>
              <td>Various team components</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Screen → Layout Mapping</h2>

        <table className="ds-table">
          <thead>
            <tr>
              <th>Screen</th>
              <th>Layout</th>
              <th>States</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Spectator Display</td>
              <td>TV Display</td>
              <td>Idle, Pregame, Live, Endgame</td>
            </tr>
            <tr>
              <td>Court Display</td>
              <td>TV Display</td>
              <td>Idle, Ready, Live, Overlays</td>
            </tr>
            <tr>
              <td>Control Panel</td>
              <td>Mobile Stack</td>
              <td>Setup, Preview, Live, Endgame</td>
            </tr>
            <tr>
              <td>Player Setup</td>
              <td>Mobile Stack</td>
              <td>Session check, Form, In-progress</td>
            </tr>
            <tr>
              <td>Player Playing</td>
              <td>Mobile Stack</td>
              <td>Waiting, Live, Finished</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>CSS Architecture</h2>

        <div className="ds-code-block ds-code-block--pre">
          <pre>{cssArchitectureExample}</pre>
        </div>
      </section>

      <section className="ds-section">
        <h2>Opportunities for Unification</h2>

        <div className="ds-opportunity-list">
          <div className="ds-opportunity">
            <h4>🔄 Header Component</h4>
            <p>
              Currently: <code>SpectatorHeader</code> for TV, <code>Header</code> for mobile
            </p>
            <p>Could unify into one <code>AppHeader</code> with viewport-aware rendering</p>
          </div>

          <div className="ds-opportunity">
            <h4>🔄 Team Display</h4>
            <p>Currently: Different implementations in Pregame, Live, Preview, Setup</p>
            <p>
              Could extract <code>TeamCard</code> component with variants
            </p>
          </div>

          <div className="ds-opportunity">
            <h4>🔄 Action Buttons</h4>
            <p>
              Currently: <code>.btn</code>, <code>.preview-btn</code>, <code>.control-button</code>
            </p>
            <p>
              Could consolidate into <code>.btn</code> with modifiers
            </p>
          </div>

          <div className="ds-opportunity">
            <h4>🔄 Player Photo/Avatar</h4>
            <p>Currently: Inline rendering in multiple components</p>
            <p>
              Could extract <code>PlayerAvatar</code> component with size variants
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
