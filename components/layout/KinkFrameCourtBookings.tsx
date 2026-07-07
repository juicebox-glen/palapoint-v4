const COURTS = [
  {
    id: '01',
    status: 'available' as const,
    sub: 'Open for immediate booking',
  },
  {
    id: '02',
    status: 'busy' as const,
    eta: '12m',
    progress: 82,
  },
  {
    id: '03',
    status: 'busy' as const,
    eta: '54m',
    progress: 16,
  },
  {
    id: '04',
    status: 'available' as const,
    sub: 'Open for immediate booking',
  },
] as const

/** Four-card court bookings list for the kink-frame content panel. */
export function KinkFrameCourtBookings() {
  return (
    <div className="kink-frame-courts-stack">
      <header className="kink-frame-courts-header">
        <div className="kink-frame-courts-label kink-frame-broadcast-item kink-frame-broadcast-item--0">
          Court bookings
        </div>
        <div className="kink-frame-courts-summary kink-frame-broadcast-item kink-frame-broadcast-item--1">
          2 / 4 free
        </div>
      </header>

      <div className="kink-frame-courts-list">
        {COURTS.map((court, index) => (
          <article
            key={court.id}
            className={[
              'kink-frame-court-card',
              `kink-frame-court-card--${court.status}`,
              'kink-frame-broadcast-item',
              `kink-frame-broadcast-item--${index + 2}`,
            ].join(' ')}
          >
            <div className="kink-frame-court-card-top">
              <h3 className="kink-frame-court-card-title">Court {court.id}</h3>
              <span
                className={[
                  'kink-frame-court-card-badge',
                  court.status === 'available' ? 'kink-frame-court-card-badge--available' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {court.status === 'available' ? 'Available' : 'In use'}
              </span>
            </div>

            {court.status === 'available' ? (
              <p className="kink-frame-court-card-sub kink-frame-court-card-sub--available">
                {court.sub}
              </p>
            ) : (
              <>
                <div className="kink-frame-court-card-divider" />
                <div className="kink-frame-court-card-status">
                  <p className="kink-frame-court-card-eta">
                    Available in <strong>{court.eta}</strong>
                  </p>
                  <div className="kink-frame-court-card-progress" aria-hidden>
                    <span style={{ width: `${court.progress}%` }} />
                  </div>
                </div>
              </>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
