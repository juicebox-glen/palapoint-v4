'use client'

import type { VenueBranding } from '@/lib/venue'

interface HeaderProps {
  showLogo?: boolean
  status?: 'live' | 'ready' | 'finished' | 'complete'
  statusText?: string
  courtName?: string
  branding?: VenueBranding | null
}

export default function Header({
  showLogo = true,
  status,
  statusText,
  courtName,
  branding,
}: HeaderProps) {
  const logoContent = branding ? (
    branding.logoUrl ? (
      <img src={branding.logoUrl} alt={branding.companyName} className="setup-logo-img" />
    ) : (
      <span className="setup-logo-text">{branding.companyName}</span>
    )
  ) : (
    <img src="/images/squareone-logo.png" alt="Square One" className="setup-logo-img" />
  )

  return (
    <>
      {showLogo && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            paddingBottom: '40px',
            overflow: 'hidden',
            maxWidth: '100%',
          }}
        >
          {logoContent}
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
