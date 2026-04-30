import Link from 'next/link'
import { getPlayerInitials } from '@/lib/utils/name-format'

const DS_PHOTO_A = 'Glen Noble'
const DS_PHOTO_B = 'Rob Anderson'
const DS_PHOTO_CTRL_B = 'Julian Waters'

export default function PhotosPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Player Photos &amp; Avatars</h1>
        <p>Player identification across different contexts</p>
      </header>

      <section className="ds-section">
        <h2>Spectator Display - Pregame</h2>
        <p>Large portrait photos with team-colored borders and glow</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark" style={{ padding: '2rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div
                className="spectator-pregame-photo-wrap spectator-pregame-photo-a"
                style={{ width: '120px', height: '150px' }}
              >
                <span className="spectator-pregame-initials" style={{ fontSize: '2rem' }}>
                  {getPlayerInitials(DS_PHOTO_A)}
                </span>
              </div>
              <div
                className="spectator-pregame-photo-wrap spectator-pregame-photo-b"
                style={{ width: '120px', height: '150px' }}
              >
                <span className="spectator-pregame-initials" style={{ fontSize: '2rem' }}>
                  {getPlayerInitials(DS_PHOTO_B)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <h3>With Photos</h3>
        <p className="ds-note">
          Photos are square-cropped, displayed in portrait containers with team borders
        </p>
      </section>

      <section className="ds-section">
        <h2>Spectator Display - Live</h2>
        <p>Smaller photos in score cards</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div className="spectator-live-photo spectator-live-photo-a" style={{ width: '60px', height: '70px' }}>
                <span className="spectator-live-initials">{getPlayerInitials(DS_PHOTO_A)}</span>
              </div>
              <div className="spectator-live-photo spectator-live-photo-a" style={{ width: '60px', height: '70px' }}>
                <span className="spectator-live-initials">{getPlayerInitials(DS_PHOTO_B)}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Control Panel - Preview</h2>
        <p>Square avatars with rounded corners</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <div
                className="preview-avatar preview-avatar-a"
                style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '2px solid var(--team-a)',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--team-a)' }}>
                  {getPlayerInitials(DS_PHOTO_A)}
                </span>
              </div>
              <div
                className="preview-avatar preview-avatar-b"
                style={{
                  width: '64px',
                  height: '64px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  border: '2px solid var(--team-b)',
                }}
              >
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--team-b)' }}>
                  {getPlayerInitials(DS_PHOTO_CTRL_B)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Setup Form - Photo Capture</h2>
        <p>Circular photos with camera/upload buttons</p>

        <div className="ds-component-row">
          <div className="ds-component-demo ds-component-demo--dark">
            <div className="player-photo-capture" style={{ width: '64px', height: '64px' }}>
              <div
                className="photo-placeholder"
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  background: 'var(--bg-tertiary)',
                  border: '2px dashed var(--border-default)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>📷</span>
              </div>
            </div>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'var(--bg-tertiary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
              }}
            >
              G
            </div>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Design Guidelines</h2>
        <ul className="ds-guidelines">
          <li>
            <strong>Team A (Blue)</strong>: Border color <code>var(--team-a)</code>, glow uses rgba of same
          </li>
          <li>
            <strong>Team B (Pink)</strong>: Border color <code>var(--team-b)</code>, glow uses rgba of same
          </li>
          <li>
            <strong>Initials</strong>: <code>getPlayerInitials()</code> in{' '}
            <code>@/lib/utils/name-format</code> — two initials when first + last word exist (e.g.
            &quot;Glen Noble&quot; → GN); single-token names use up to two letters (e.g. &quot;Glen&quot; → GL);
            empty → ?.
          </li>
          <li>
            <strong>Photo aspect</strong>: Always square source, may display in portrait container
          </li>
          <li>
            <strong>Photo size</strong>: Captured at 400×400px, compressed to JPEG 80%
          </li>
        </ul>
      </section>
    </div>
  )
}
