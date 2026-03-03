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
        <div className="page-header-center">
          <img
            src="/images/squareone-logo.png"
            alt="Square One"
            className="setup-logo-img"
          />
        </div>
      )}

      {(status || courtName) && (
        <div className="page-header">
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
