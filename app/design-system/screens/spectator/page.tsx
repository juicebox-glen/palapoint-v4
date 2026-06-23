import Link from 'next/link'

import { ScreenPreview } from '../../components/ScreenPreview'

export default function SpectatorScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Spectator display</h1>
        <p>Lounge / bar TV for a court match — not the matchplay event board (1920×1080).</p>
        <p className="ds-screen-note">
          All sizing uses a 1920×1080 viewport. Design-system previews render at true TV dimensions; open a preview in
          a new tab to check before deploying to a screen.
        </p>
      </header>

      <section className="ds-section">
        <h2>Screen</h2>
        <ScreenPreview
          title="Spectator display"
          description="Idle, pre-game, live, end game — real spectator components in preview mode."
          viewport="tv"
          states={[
            { name: 'idle', label: 'Idle', url: '/design-system/preview/spectator?state=idle' },
            { name: 'pregame', label: 'Pre-game', url: '/design-system/preview/spectator?state=pregame' },
            { name: 'live', label: 'Live', url: '/design-system/preview/spectator?state=live' },
            { name: 'set_point', label: 'Set Point', url: '/design-system/preview/spectator?state=set_point' },
            { name: 'match_point', label: 'Match Point', url: '/design-system/preview/spectator?state=match_point' },
            { name: 'endgame', label: 'End Game', url: '/design-system/preview/spectator?state=endgame' },
          ]}
        />
      </section>

      <section className="ds-section">
        <h2>Opportunities for unification</h2>
        <ul className="ds-component-list">
          <li>
            Migrate legacy hex (serve orb, pre-game split field) to <code>--court-*</code> and shared text tokens so
            spectator and court displays theme together.
          </li>
          <li>
            Share header / badge markup with matchplay TV board where both need “LIVE” and event title — reduce
            one-off CSS for the same semantic states.
          </li>
          <li>
            Align background motion (e.g. GradientWaveDrift) configuration with any future global “venue TV” motion
            guidelines.
          </li>
        </ul>
      </section>
    </div>
  )
}
