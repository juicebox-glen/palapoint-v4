import { formatPlayerName, formatTeamScoreboard } from '@/lib/utils/name-format'

const DS_SAMPLE_PLAYER = 'Glen Noble'

export default function TypographyPage() {
  return (
    <div className="ds-page">
      <header className="ds-page-header">
        <h1>Typography</h1>
        <p>Font families, sizes, and text styles</p>
      </header>

      <section className="ds-section">
        <h2>Font Families</h2>

        <div className="ds-type-sample">
          <h3>Inter (Primary)</h3>
          <p style={{ fontFamily: 'var(--font-primary)' }}>
            The quick brown fox jumps over the lazy dog.
            <br />
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            abcdefghijklmnopqrstuvwxyz
            <br />
            0123456789
          </p>
        </div>

        <div className="ds-type-sample">
          <h3>Space Grotesk (Display/Scores)</h3>
          <p style={{ fontFamily: 'var(--font-display)' }}>
            The quick brown fox jumps over the lazy dog.
            <br />
            ABCDEFGHIJKLMNOPQRSTUVWXYZ
            <br />
            abcdefghijklmnopqrstuvwxyz
            <br />
            0123456789
          </p>
        </div>
      </section>

      <section className="ds-section">
        <h2>Type Scale</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Mapped from <code style={{ color: 'var(--text-muted)' }}>--ui-font-*</code> as{' '}
          <code style={{ color: 'var(--text-muted)' }}>--text-*</code> on this showcase.
        </p>

        <div className="ds-type-scale">
          <TypeSample size="--text-xs" label="Extra Small" />
          <TypeSample size="--text-sm" label="Small" />
          <TypeSample size="--text-base" label="Base" />
          <TypeSample size="--text-lg" label="Large" />
          <TypeSample size="--text-xl" label="Extra Large" />
          <TypeSample size="--text-2xl" label="2XL" />
          <TypeSample size="--text-3xl" label="3XL" />
          <TypeSample size="--text-4xl" label="4XL" />
        </div>
      </section>

      <section className="ds-section">
        <h2>Font Weights</h2>

        <div className="ds-weight-samples">
          <p style={{ fontWeight: 400 }}>Regular (400) - Body text</p>
          <p style={{ fontWeight: 500 }}>Medium (500) - UI elements</p>
          <p style={{ fontWeight: 600 }}>Semibold (600) - Headings</p>
          <p style={{ fontWeight: 700 }}>Bold (700) - Emphasis, scores</p>
        </div>
      </section>

      <section className="ds-section">
        <h2>Score Typography</h2>
        <p>Used on spectator and court displays</p>

        <div className="ds-score-samples">
          <div className="ds-score-sample">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '8rem',
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              40
            </span>
            <code>Points (TV)</code>
          </div>
          <div className="ds-score-sample">
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: '4rem',
                fontWeight: 700,
                lineHeight: 1,
                color: 'var(--text-muted)',
              }}
            >
              6
            </span>
            <code>Games (TV)</code>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Player names</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Derived via{' '}
          <code style={{ color: 'var(--text-muted)' }}>@/lib/utils/name-format</code> (`formatPlayerName`,
          `formatTeamScoreboard`).
        </p>

        <div className="ds-name-samples">
          <div>
            <span style={{ fontSize: '3rem', fontWeight: 700, letterSpacing: '0.02em' }}>
              {formatPlayerName(DS_SAMPLE_PLAYER, 'surname_short')}
            </span>
            <code>surname_short (TV/spectator stack)</code>
          </div>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 500 }}>
              {formatPlayerName(DS_SAMPLE_PLAYER, 'abbreviated')}
            </span>
            <code>abbreviated</code>
          </div>
          <div>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
              {formatTeamScoreboard('Glen Noble', 'Rob Anderson', 1)}
            </span>
            <code>formatTeamScoreboard (control/court scoreboards)</code>
          </div>
        </div>
      </section>
    </div>
  )
}

function TypeSample({ size, label }: { size: string; label: string }) {
  return (
    <div className="ds-type-row">
      <span style={{ fontSize: `var(${size})` }}>The quick brown fox</span>
      <code>{size}</code>
      <span className="ds-type-label">{label}</span>
    </div>
  )
}
