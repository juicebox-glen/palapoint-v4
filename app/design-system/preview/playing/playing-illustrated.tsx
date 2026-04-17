import type { VenueBranding } from '@/lib/venue'

export function LiveState({ branding: _branding }: { branding: VenueBranding }) {
  return (
    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          <span style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%' }} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--success)' }}>LIVE</span>
          <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>• Court 1</span>
        </div>
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem 1.5rem',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            textAlign: 'center',
            marginBottom: '1.5rem',
            padding: '0.5rem',
            background: 'rgba(91, 108, 255, 0.1)',
            borderRadius: 'var(--radius-lg)',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--team-a)' }}>YOUR TEAM</span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1.5rem',
            paddingBottom: '1.5rem',
            borderBottom: '1px solid var(--border-default)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '8px', height: '60px', background: 'var(--team-a)', borderRadius: 'var(--radius-md)' }} />
            <div>
              <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Noble / Anderson</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.25rem' }}>
                <span
                  style={{ width: '10px', height: '10px', background: 'var(--court-ball)', borderRadius: '50%' }}
                />
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Serving</span>
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700 }}>30</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>3 games</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{ width: '8px', height: '60px', background: 'var(--team-b)', borderRadius: 'var(--radius-md)' }} />
            <div style={{ fontWeight: 600, fontSize: '1.125rem' }}>Waters / Pettit</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3rem', fontWeight: 700 }}>15</div>
            <div style={{ fontSize: '1.25rem', color: 'var(--text-muted)' }}>2 games</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <span
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          1 SET
        </span>
        <span
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--bg-secondary)',
            borderRadius: 'var(--radius-full)',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          GOLDEN
        </span>
      </div>
    </div>
  )
}

export function FinishedState({ branding: _branding }: { branding: VenueBranding }) {
  return (
    <div
      style={{
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', marginBottom: '1.5rem' }}>
        <span style={{ fontSize: '1.25rem', fontWeight: 700 }}>SQUARE</span>
        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--team-a)' }}>ONE</span>
      </div>

      <div
        style={{
          padding: '0.5rem 1.5rem',
          background: 'var(--success-bg)',
          border: '1px solid var(--success)',
          borderRadius: 'var(--radius-full)',
          fontSize: '0.875rem',
          fontWeight: 700,
          color: 'var(--success)',
          marginBottom: '2rem',
        }}
      >
        MATCH COMPLETE
      </div>

      <div
        style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-xl)',
          padding: '2rem',
          width: '100%',
          maxWidth: '320px',
          marginBottom: '2rem',
        }}
      >
        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)', marginBottom: '0.5rem' }}>
          🎉 YOU WON!
        </div>

        <div style={{ fontSize: '1.125rem', fontWeight: 600, marginBottom: '1.5rem' }}>Noble / Anderson</div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '1rem',
            fontSize: '2.5rem',
            fontWeight: 700,
          }}
        >
          <span style={{ color: 'var(--team-a)' }}>6</span>
          <span style={{ color: 'var(--text-muted)' }}>-</span>
          <span>4</span>
        </div>
      </div>

      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Thanks for playing!</p>
    </div>
  )
}
