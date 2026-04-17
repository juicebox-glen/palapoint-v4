'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body style={{ background: '#0E1116', color: '#fff', fontFamily: 'system-ui, sans-serif', padding: '2rem' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Something went wrong</h1>
        <p style={{ opacity: 0.8, marginBottom: '1rem' }}>{error.message}</p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.75rem 1.25rem',
            borderRadius: '0.5rem',
            border: 'none',
            background: '#5B6CFF',
            color: '#fff',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </body>
    </html>
  )
}
