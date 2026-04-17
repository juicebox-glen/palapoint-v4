'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="page page-padded" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{error.message}</p>
      <button type="button" className="btn btn-primary" onClick={() => reset()}>
        Try again
      </button>
    </div>
  )
}
