import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="page page-padded" style={{ padding: '2rem', maxWidth: '480px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Page not found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
        This URL does not match any route in the app.
      </p>
      <Link href="/" className="btn btn-primary" style={{ display: 'inline-block', textDecoration: 'none' }}>
        Home
      </Link>
    </div>
  )
}
