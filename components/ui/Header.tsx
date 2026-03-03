'use client'

interface HeaderProps {
  showLogo?: boolean
  status?: 'live' | 'ready' | 'finished' | 'complete'
  statusText?: string
  courtName?: string
}

export default function Header({
  showLogo = true,
  status,
  statusText,
  courtName,
}: HeaderProps) {
  return (
    <>
      {showLogo && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: '0.75rem',
          }}
        >
          <img
            src="/images/squareone-logo.png"
            alt="Square One"
            className="setup-logo-img"
          />
        </div>
      )}

      {(status || courtName) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingBottom: '0.75rem',
          }}
        >
          {status && (
            <div className={`status-badge ${status}`}>
              <span className="status-badge-dot"></span>
              {statusText || status.toUpperCase()}
            </div>
          )}
          {courtName && (
            <span
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.875rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              {courtName}
            </span>
          )}
        </div>
      )}
    </>
  )
}
