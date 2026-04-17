import Link from 'next/link'

import { ScreenDesignTokens } from '../../components/ScreenDesignTokens'
import { ScreenPreview } from '../../components/ScreenPreview'

export default function SetupScreensPage() {
  return (
    <div className="ds-page ds-page--wide">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Player Setup</h1>
        <p>Mobile flow for players to join a match on court. Primary viewport: 375px.</p>
      </header>

      <ScreenPreview
        title="Player Setup"
        description="Enter names, capture photos, and confirm before the staff starts the match"
        viewport="mobile"
        states={[
          { name: 'form', label: 'Form', url: '/design-system/preview/setup?state=form' },
          { name: 'review', label: 'Review', url: '/design-system/preview/setup?state=review' },
        ]}
      />

      <ScreenDesignTokens
        typography={[
          {
            token: "var(--font-family) ('Inter', …)",
            usage: 'Documented as all-Inter in `setup-form.css`; section titles, inputs, mode cards.',
          },
          {
            token: '--ui-font-* (via globals)',
            usage: 'Not referenced directly in setup form — sizes are custom rem in the stylesheet.',
          },
        ]}
        colors={[
          {
            token: '--background, --foreground, --primary, …',
            usage: 'Scoped on `.setup-screen` (hsl literals) — approximates dark surfaces; migrate toward `--bg-*` / `--text-*` for parity.',
          },
          {
            token: '--brand-primary (host)',
            usage: 'Passed through header/logo when venue is configured.',
          },
          {
            token: '--text-secondary, --error',
            usage: 'Used in shared `Header` / error paths when linked from other flows.',
          },
        ]}
        stylesheets={[
          'app/styles/setup-form.css',
          'app/styles/tokens/colors.css',
          'app/styles/tokens/typography.css',
        ]}
        note="Player setup is the main place local `.setup-screen` variables diverge from global `--bg-primary` / `--text-primary`; align these when tightening the theme."
      />

      <section className="ds-section">
        <h2>Notes</h2>
        <p className="ds-note" style={{ marginBottom: '1rem' }}>
          Embedded previews use the same <code>MatchSetupForm</code> as production with mock branding. Submit and
          session calls are disabled in preview; use a real setup URL for end-to-end testing.
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
              <td>Form</td>
              <td>Player rows, photos, validation</td>
            </tr>
            <tr>
              <td>Review</td>
              <td>Confirm lineup before submitting to staff</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  )
}
