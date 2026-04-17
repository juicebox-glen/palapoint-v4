import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

export default function ControlScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Staff Control Panel</h1>
        <p>
          Mobile/tablet interface for staff to set up and manage matches. Primary viewport: 375px (mobile),
          also used on iPad.
        </p>
      </header>

      <ScreenPreview
        title="Staff Control"
        description="Match setup, preview, live scoring controls, and end-of-game actions"
        viewport="mobile"
        states={[
          { name: 'setup', label: 'Setup', url: '/design-system/preview/control?state=setup' },
          { name: 'preview', label: 'Preview', url: '/design-system/preview/control?state=preview' },
          { name: 'live', label: 'Live', url: '/design-system/preview/control?state=live' },
          { name: 'endgame', label: 'End Game', url: '/design-system/preview/control?state=endgame' },
        ]}
      />

      <ScreenDesignTokens
        typography={[
          {
            token: "var(--font-family) ('Inter', …)",
            usage: 'All control UI: headers, scoreboard, buttons, modals (`control-panel.css`).',
          },
          {
            token: '0.8125rem – 1rem typical',
            usage: 'Live header, game mode label, score names; thumb-sized buttons scale with padding.',
          },
        ]}
        colors={[
          { token: '--bg-primary', usage: 'Full panel background.' },
          { token: '--bg-secondary, --bg-tertiary', usage: 'Scoreboard card gradient, dots, chrome.' },
          { token: '--text-primary, --text-secondary', usage: 'LIVE line, game mode, names.' },
          { token: '--team-a, --team-b (+ -glow)', usage: 'Serve bars, score buttons, live pulse dot.' },
          { token: '--error', usage: 'Errors, END MATCH, danger modal actions.' },
          { token: '--border-default', usage: 'Dividers and modal edges where used.' },
        ]}
        stylesheets={[
          'app/styles/control-panel.css',
          'app/styles/setup-form.css',
          'app/styles/tokens/colors.css',
          'app/styles/tokens/typography.css',
        ]}
        note="Setup and preview states reuse `MatchSetupForm` styles from `setup-form.css` (mixed local hsl + `--font-family`)."
      />

      <section className="ds-section">
        <h2>States</h2>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Trigger</th>
              <th>Key Elements</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Setup</td>
              <td>Initial load / after ending match</td>
              <td>Player name inputs, photo capture, game mode selection, settings toggles</td>
            </tr>
            <tr>
              <td>Preview</td>
              <td>After clicking Continue from setup</td>
              <td>READY badge, team preview, Edit/Start buttons</td>
            </tr>
            <tr>
              <td>Live</td>
              <td>After clicking Start Match</td>
              <td>Score display, undo button, point controls</td>
            </tr>
            <tr>
              <td>End Game</td>
              <td>Match completed</td>
              <td>Final scores, Rematch/Edit buttons</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
