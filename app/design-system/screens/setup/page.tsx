import Link from 'next/link'

import { ScreenPreview } from '../../components/ScreenPreview'

export default function SetupScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Player Setup</h1>
        <p>
          Mobile interface for players to join matches via QR code. Accessed at /setup/[company]/[venue]/[court]
        </p>
      </header>

      <ScreenPreview
        title="Player Setup"
        description="QR code join flow for players"
        viewport="mobile"
        states={[
          { name: 'scan', label: 'QR Code', url: '/design-system/preview/setup?state=scan' },
          { name: 'join', label: 'Join Form', url: '/design-system/preview/setup?state=join' },
          { name: 'waiting', label: 'Waiting', url: '/design-system/preview/setup?state=waiting' },
          { name: 'in_progress', label: 'In Progress', url: '/design-system/preview/setup?state=in_progress' },
        ]}
      />

      <section className="ds-section">
        <h2>User Flow</h2>
        <div className="ds-flow-diagram">
          <div className="ds-flow-step">
            <span className="ds-flow-number">1</span>
            <span className="ds-flow-label">Scan QR</span>
            <span className="ds-flow-desc">On court display</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">2</span>
            <span className="ds-flow-label">Join</span>
            <span className="ds-flow-desc">Enter name, pick team</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">3</span>
            <span className="ds-flow-label">Wait</span>
            <span className="ds-flow-desc">Until match starts</span>
          </div>
          <div className="ds-flow-arrow">→</div>
          <div className="ds-flow-step">
            <span className="ds-flow-number">4</span>
            <span className="ds-flow-label">Play</span>
            <span className="ds-flow-desc">View live score</span>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>States</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Trigger</th>
              <th>Key Elements</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>QR Code (Court Display)</td>
              <td>Idle state on court</td>
              <td>QR code linking to /setup route, instructions</td>
            </tr>
            <tr>
              <td>Join Form</td>
              <td>Player scans QR</td>
              <td>Name input, team selector, optional photo</td>
            </tr>
            <tr>
              <td>Waiting</td>
              <td>Player joined, match not started</td>
              <td>WAITING badge, team confirmation, player card</td>
            </tr>
            <tr>
              <td>In Progress</td>
              <td>Match started</td>
              <td>LIVE badge, score display, watch message</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section className="ds-section">
        <h2>Notes</h2>
        <div className="ds-note-block">
          <p>
            <strong>QR Code Generation:</strong> QR links to /setup/[company]/[venue]/[court]. The setup route checks
            for active matches and shows appropriate state.
          </p>
          <p>
            <strong>Team Selection:</strong> Players can join either Team A or Team B. Both slots must be filled or
            staff can set names via control panel.
          </p>
          <p>
            <strong>Photo Capture:</strong> Optional. Uses same PlayerPhotoCapture component as staff control panel.
          </p>
          <p>
            <strong>Staff form preview:</strong> The live <code>MatchSetupForm</code> is still available at{' '}
            <code>?state=form</code> and <code>?state=review</code> for production-parity testing.
          </p>
        </div>
      </section>
    </div>
  )
}
