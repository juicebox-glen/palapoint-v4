import type { VenueBranding } from '@/lib/venue'

/** Illustrative wireframes for QR/join/waiting flows (not the live `/setup` MatchSetupForm). */

export function ScanState({ branding: _branding }: { branding: VenueBranding }) {
  return (
    <div
      style={{
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        gap: '2rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.5rem', fontWeight: 700 }}>SQUARE</span>
        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--team-a)' }}>ONE</span>
      </div>

      <div
        style={{
          width: '200px',
          height: '200px',
          background: 'white',
          borderRadius: 'var(--radius-xl)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '0.875rem',
          color: '#000',
        }}
      >
        [QR Code]
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Scan to Join</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Scan this QR code with your phone to join the match on Court 1
        </p>
      </div>
    </div>
  )
}

export function JoinState({ branding: _branding }: { branding: VenueBranding }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.25rem',
            marginBottom: '0.5rem',
          }}
        >
          <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SQUARE</span>
          <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--team-a)' }}>ONE</span>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Court 1</p>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1rem' }}>Join Match</h2>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            Your Name
          </label>
          <input
            type="text"
            placeholder="Enter your name"
            readOnly
            style={{
              width: '100%',
              padding: '0.875rem',
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-primary)',
              fontSize: '1rem',
            }}
          />
        </div>

        <div style={{ marginBottom: '1rem' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            Team
          </label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '1rem',
                background: 'var(--team-a)',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                color: 'white',
                fontWeight: 600,
              }}
            >
              Team A
            </button>
            <button
              type="button"
              style={{
                flex: 1,
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontWeight: 500,
              }}
            >
              Team B
            </button>
          </div>
        </div>

        <div>
          <label
            style={{
              display: 'block',
              fontSize: '0.875rem',
              color: 'var(--text-secondary)',
              marginBottom: '0.5rem',
            }}
          >
            Photo (optional)
          </label>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              border: '2px dashed var(--border-default)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
            }}
          >
            📷
          </div>
        </div>
      </div>

      <button
        type="button"
        className="btn btn-primary btn-block"
        style={{ marginTop: 'auto' }}
      >
        JOIN MATCH
      </button>
    </div>
  )
}

export function WaitingState({ branding: _branding }: { branding: VenueBranding }) {
  return (
    <div
      style={{
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        gap: '1.5rem',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SQUARE</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--team-a)' }}>ONE</span>
      </div>

      <div
        style={{
          padding: '0.5rem 1rem',
          background: 'var(--warning-bg)',
          border: '1px solid var(--warning)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.875rem',
          fontWeight: 600,
          color: 'var(--warning)',
        }}
      >
        WAITING
      </div>

      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600, marginBottom: '0.5rem' }}>Waiting for match to start</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          You&apos;ve joined Team A on Court 1
        </p>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '300px',
        }}
      >
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>YOUR TEAM</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'var(--bg-tertiary)',
              border: '2px solid var(--team-a)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              color: 'var(--team-a)',
            }}
          >
            GN
          </div>
          <div>
            <div style={{ fontWeight: 600 }}>Glen Noble</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Team A</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function InProgressState({ branding: _branding }: { branding: VenueBranding }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span
            style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%' }}
          />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>LIVE</span>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.5rem',
          marginBottom: '1rem',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SET 1</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '2rem' }}>
          <div>
            <div style={{ fontSize: '3rem', fontWeight: 700 }}>30</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Noble / Anderson</div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.25rem',
                marginTop: '0.25rem',
              }}
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  background: 'var(--court-ball)',
                  borderRadius: '50%',
                }}
              />
              <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>Serving</span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>3 - 2</span>
            <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>GAMES</span>
          </div>

          <div>
            <div style={{ fontSize: '3rem', fontWeight: 700 }}>15</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Waters / Pettit</div>
          </div>
        </div>
      </div>

      <p
        style={{
          textAlign: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.75rem',
          padding: '1rem',
        }}
      >
        Match in progress. Watch the court display for score updates.
      </p>
    </div>
  )
}
