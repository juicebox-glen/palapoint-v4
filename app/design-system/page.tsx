import Link from 'next/link'

export default function DesignSystemHome() {
  return (
    <div className="ds-home">
      <header className="ds-header">
        <h1>PalaPoint Design System</h1>
        <p>Living documentation of screens, components, and tokens</p>
      </header>

      <nav className="ds-nav">
        <section className="ds-nav-section">
          <h2>Foundations</h2>
          <ul>
            <li>
              <Link href="/design-system/tokens">Tokens</Link>
            </li>
            <li>
              <Link href="/design-system/typography">Typography</Link>
            </li>
            <li>
              <Link href="/design-system/colors">Colors</Link>
            </li>
          </ul>
        </section>

        <section className="ds-nav-section">
          <h2>Components</h2>
          <ul>
            <li>
              <Link href="/design-system/components/buttons">Buttons</Link>
            </li>
            <li>
              <Link href="/design-system/components/badges">Badges</Link>
            </li>
            <li>
              <Link href="/design-system/components/cards">Cards</Link>
            </li>
            <li>
              <Link href="/design-system/components/headers">Headers</Link>
            </li>
            <li>
              <Link href="/design-system/components/photos">Player Photos</Link>
            </li>
            <li>
              <Link href="/design-system/components/scores">Score Displays</Link>
            </li>
          </ul>
        </section>

        <section className="ds-nav-section">
          <h2>Screens</h2>
          <ul>
            <li>
              <Link href="/design-system/screens/spectator">Spectator Display (TV)</Link>
            </li>
            <li>
              <Link href="/design-system/screens/court">Court Display (TV)</Link>
            </li>
            <li>
              <Link href="/design-system/screens/player-mobile">Staff &amp; player control</Link>
              <span className="ds-nav-route-hint"> — /control, /setup, /playing, /session-review</span>
            </li>
          </ul>
        </section>

        <section className="ds-nav-section">
          <h2>Match play</h2>
          <ul>
            <li>
              <Link href="/design-system/screens/matchplay">Matchplay — staff &amp; TV board</Link>
            </li>
          </ul>
        </section>

        <section className="ds-nav-section">
          <h2>Layouts</h2>
          <ul>
            <li>
              <Link href="/design-system/layouts">Page Layouts</Link>
            </li>
          </ul>
        </section>
      </nav>
    </div>
  )
}
