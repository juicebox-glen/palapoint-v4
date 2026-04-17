export default function TokensPage() {
  return (
    <div className="ds-page">
      <header className="ds-page-header">
        <h1>Design Tokens</h1>
        <p>The foundational values that define the visual language</p>
      </header>

      <section className="ds-section">
        <h2>Colors</h2>
        <div className="ds-token-grid">
          <ColorToken name="--bg-primary" label="Background Primary" />
          <ColorToken name="--bg-secondary" label="Background Secondary" />
          <ColorToken name="--bg-tertiary" label="Background Tertiary" />
          <ColorToken name="--text-primary" label="Text Primary" />
          <ColorToken name="--text-secondary" label="Text Secondary" />
          <ColorToken name="--text-muted" label="Text Muted" />
          <ColorToken name="--border-default" label="Border Default" />
          <ColorToken name="--border-subtle" label="Border Subtle" />
        </div>

        <h3>Team Colors</h3>
        <div className="ds-token-grid">
          <ColorToken name="--team-a" label="Team A (Blue)" />
          <ColorToken name="--team-b" label="Team B (Pink)" />
        </div>

        <h3>Semantic Colors</h3>
        <div className="ds-token-grid">
          <ColorToken name="--success" label="Success" />
          <ColorToken name="--error" label="Error" />
          <ColorToken name="--warning" label="Warning" />
          <ColorToken name="--info" label="Info" />
        </div>

        <h3>Court Colors</h3>
        <div className="ds-token-grid">
          <ColorToken name="--court-accent" label="Court Accent" />
          <ColorToken name="--court-ball" label="Court Ball" />
          <ColorToken name="--court-ball-border" label="Court Ball Border" />
        </div>
      </section>

      <section className="ds-section">
        <h2>Spacing</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          UI spacing tokens (<code style={{ color: 'var(--text-muted)' }}>--ui-space-*</code>
          ); showcase uses <code style={{ color: 'var(--text-muted)' }}>--space-*</code> aliases.
        </p>
        <div className="ds-spacing-grid">
          <SpacingToken name="--space-xs" />
          <SpacingToken name="--space-sm" />
          <SpacingToken name="--space-md" />
          <SpacingToken name="--space-lg" />
          <SpacingToken name="--space-xl" />
          <SpacingToken name="--space-2xl" />
        </div>
      </section>

      <section className="ds-section">
        <h2>Border Radius</h2>
        <div className="ds-radius-grid">
          <RadiusToken name="--radius-sm" />
          <RadiusToken name="--radius-md" />
          <RadiusToken name="--radius-lg" />
          <RadiusToken name="--radius-xl" />
          <RadiusToken name="--radius-full" />
        </div>
      </section>
    </div>
  )
}

function ColorToken({ name, label }: { name: string; label: string }) {
  return (
    <div className="ds-color-token">
      <div className="ds-color-swatch" style={{ backgroundColor: `var(${name})` }} />
      <div className="ds-token-info">
        <code>{name}</code>
        <span>{label}</span>
      </div>
    </div>
  )
}

function SpacingToken({ name }: { name: string }) {
  return (
    <div className="ds-spacing-token">
      <div className="ds-spacing-bar" style={{ width: `var(${name})`, height: `var(${name})` }} />
      <code>{name}</code>
    </div>
  )
}

function RadiusToken({ name }: { name: string }) {
  return (
    <div className="ds-radius-token">
      <div className="ds-radius-box" style={{ borderRadius: `var(${name})` }} />
      <code>{name}</code>
    </div>
  )
}
