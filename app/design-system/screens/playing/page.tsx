import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

export default function PlayingScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Player Playing</h1>
        <p>In-match mobile view for players (scores, sides, prompts). Primary viewport: 375px.</p>
      </header>

      <ScreenPreview
        title="Player Playing"
        description="Point-by-point view and match prompts while the match is in progress"
        viewport="mobile"
        states={[
          { name: 'score', label: 'Score', url: '/design-system/preview/playing?state=score' },
          { name: 'overlay', label: 'Overlay', url: '/design-system/preview/playing?state=overlay' },
        ]}
      />

      <ScreenDesignTokens
        typography={[
          {
            token: "var(--font-family) ('Inter', …)",
            usage: '`PlayingDisplay` + `Header`; inline headings use rem weights (e.g. 1.5rem session ended).',
          },
          {
            token: 'components: `btn`, `stack`',
            usage: 'Shared button and layout utilities from global/component CSS.',
          },
        ]}
        colors={[
          { token: '--bg-primary', usage: 'Page background via `.page` / layout patterns.' },
          { token: '--text-primary, --text-secondary', usage: 'Body copy and muted explanations.' },
          { token: '--brand-primary', usage: 'Header branding strip when `branding` is set.' },
          { token: '--team-a, --team-b', usage: 'Score / team emphasis where playing UI mirrors control styling.' },
        ]}
        stylesheets={[
          'components/displays/PlayingDisplay.tsx (imports)',
          'app/styles/setup-form.css',
          'app/styles/components/buttons.css',
          'app/styles/tokens/colors.css',
          'app/styles/tokens/typography.css',
        ]}
        note="Embedded preview is still a placeholder; tokens above reflect the live `PlayingDisplay` implementation once previews are wired."
      />

      <section className="ds-section">
        <h2>Notes</h2>
        <p className="ds-note" style={{ marginBottom: '1rem' }}>
          Placeholder preview panes until playing screens are embedded with mock data.
        </p>
        <table className="ds-table">
          <thead>
            <tr>
              <th>State</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Score</td>
              <td>Current game and set summary</td>
            </tr>
            <tr>
              <td>Overlay</td>
              <td>Server announcements, side swap, etc.</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
