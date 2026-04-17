export interface DesignTokenRow {
  /** CSS variable, font name, or file/class reference */
  token: string
  /** Where it appears or what it controls */
  usage: string
}

interface ScreenDesignTokensProps {
  /** Primary font stack and scale (tokens, vw, etc.) */
  typography: DesignTokenRow[]
  /** Semantic and surface colors */
  colors: DesignTokenRow[]
  /** Main stylesheets for this surface */
  stylesheets: string[]
  /** Optional caveat (e.g. legacy hex, migration) */
  note?: string
}

export function ScreenDesignTokens({ typography, colors, stylesheets, note }: ScreenDesignTokensProps) {
  return (
    <section className="ds-section">
      <h2>Typography &amp; colors</h2>
      <p className="ds-token-intro">
        Reference for aligning this screen with global tokens in{' '}
        <code>app/styles/tokens/</code> and the stylesheets below. Venue branding overrides{' '}
        <code>--brand-primary</code>, <code>--team-a</code>, and <code>--team-b</code> on the host route.
      </p>

      <h3 className="ds-token-heading">Typography</h3>
      <table className="ds-table ds-token-table">
        <thead>
          <tr>
            <th>Token / source</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {typography.map((row, i) => (
            <tr key={`ty-${i}-${row.token}`}>
              <td>
                <code className="ds-token-code">{row.token}</code>
              </td>
              <td>{row.usage}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-token-heading">Colors</h3>
      <table className="ds-table ds-token-table">
        <thead>
          <tr>
            <th>Token / value</th>
            <th>Role</th>
          </tr>
        </thead>
        <tbody>
          {colors.map((row, i) => (
            <tr key={`co-${i}-${row.token}`}>
              <td>
                <code className="ds-token-code">{row.token}</code>
              </td>
              <td>{row.usage}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="ds-token-heading">Stylesheets</h3>
      <ul className="ds-token-file-list">
        {stylesheets.map((path) => (
          <li key={path}>
            <code className="ds-token-code">{path}</code>
          </li>
        ))}
      </ul>

      {note ? (
        <div className="ds-note-block" style={{ marginTop: '1.25rem' }}>
          <p>
            <strong>Note:</strong> {note}
          </p>
        </div>
      ) : null}
    </section>
  )
}
