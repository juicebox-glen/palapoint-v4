import Link from 'next/link'

import { PalaLiveDsNav } from './components/PalaLiveDsNav'

export default function PalaLiveDesignSystemHome() {
  return (
    <div className="pl-ds-shell palalive-staff-shell">
      <PalaLiveDsNav active="/design-system/palalive" />

      <header className="pl-ds-header">
        <p className="pl-ds-eyebrow">PalaLive</p>
        <h1>Design system</h1>
        <p>
          Clean catalog for the venue product only — TV (Idle / Social / Showcase) and staff phone chrome.
          Tokens live in <code>app/styles/palalive-tokens.css</code>. The v4 player/court hub stays at{' '}
          <Link href="/design-system">/design-system</Link>.
        </p>
      </header>

      <nav className="pl-ds-cards">
        <Link href="/design-system/palalive/foundations" className="pl-ds-card">
          <span className="pl-ds-card-label">Foundations</span>
          <span className="pl-ds-card-title">Colour, type, surfaces</span>
          <span className="pl-ds-card-desc">Charcoal cards, lime accent, stage ambient — one token file.</span>
        </Link>
        <Link href="/design-system/palalive/components" className="pl-ds-card">
          <span className="pl-ds-card-label">Components</span>
          <span className="pl-ds-card-title">Staff UI primitives</span>
          <span className="pl-ds-card-desc">Buttons, pills, cards, court picker, scoreboard pieces.</span>
        </Link>
        <Link href="/design-system/palalive/screens" className="pl-ds-card">
          <span className="pl-ds-card-label">Screens</span>
          <span className="pl-ds-card-title">TV + staff flows</span>
          <span className="pl-ds-card-desc">Every live state, driven by the same production components.</span>
        </Link>
      </nav>

      <section className="pl-ds-section">
        <h2>How to keep this in sync</h2>
        <ul className="pl-ds-list">
          <li>
            Visual UI changes under <code>components/palalive/*</code> or <code>app/styles/palalive-*.css</code>{' '}
            must update the matching preview in the same change.
          </li>
          <li>
            New screen states go in <code>app/design-system/palalive/lib/screen-catalog.ts</code> and appear on{' '}
            Screens automatically.
          </li>
          <li>
            Retune product colour by editing <code>palalive-tokens.css</code> — foundations + all screens inherit.
          </li>
        </ul>
      </section>
    </div>
  )
}
