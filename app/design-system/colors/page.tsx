import Link from 'next/link'

export default function ColorsPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Design System
      </Link>
      <header className="ds-page-header">
        <h1>Colors</h1>
        <p>Palette and semantic colors. Full token list lives on the Tokens page.</p>
      </header>
      <div className="ds-placeholder">
        <p>
          This section will expand with ramps and usage guidance. For now, see{' '}
          <Link href="/design-system/tokens" style={{ color: 'var(--team-a)' }}>
            Tokens
          </Link>{' '}
          for all color variables.
        </p>
      </div>
    </div>
  )
}
