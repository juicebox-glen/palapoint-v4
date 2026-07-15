import { PalaLiveDsNav } from '../components/PalaLiveDsNav'

import '@/app/styles/palalive-tokens.css'

const SURFACE_TOKENS = [
  { name: '--void', label: 'Void' },
  { name: '--stage', label: 'Stage' },
  { name: '--panel', label: 'Panel' },
  { name: '--card', label: 'Card' },
  { name: '--card-inner', label: 'Card inner' },
  { name: '--card-edge', label: 'Card edge' },
  { name: '--scoreboard-alt', label: 'Scoreboard alt' },
] as const

const INK_TOKENS = [
  { name: '--ink', label: 'Ink' },
  { name: '--mist', label: 'Mist' },
  { name: '--accent', label: 'Accent' },
  { name: '--state-up', label: 'Up' },
  { name: '--state-down', label: 'Down' },
  { name: '--gold', label: 'Gold' },
  { name: '--silver', label: 'Silver' },
  { name: '--bronze', label: 'Bronze' },
] as const

function Swatch({ name, label }: { name: string; label: string }) {
  return (
    <div className="pl-ds-swatch">
      <div className="pl-ds-swatch-chip" style={{ background: `var(${name})` }} />
      <code>{name}</code>
      <span>{label}</span>
    </div>
  )
}

export default function PalaLiveFoundationsPage() {
  return (
    <div className="pl-ds-shell palalive-staff-shell">
      <PalaLiveDsNav active="/design-system/palalive/foundations" />

      <header className="pl-ds-header">
        <h1>Foundations</h1>
        <p>
          Source of truth: <code>app/styles/palalive-tokens.css</code> on{' '}
          <code>.palalive-shell</code> / <code>.palalive-staff-shell</code>. Raised surfaces use{' '}
          <code>--card-border</code> (default <code>none</code>).
        </p>
      </header>

      <section className="pl-ds-section">
        <h2>Surfaces</h2>
        <div className="pl-ds-swatch-grid">
          {SURFACE_TOKENS.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Ink &amp; accent</h2>
        <div className="pl-ds-swatch-grid">
          {INK_TOKENS.map((t) => (
            <Swatch key={t.name} {...t} />
          ))}
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Typography</h2>
        <div className="pl-ds-type-samples">
          <p className="pl-ds-type-display">Space Grotesk · Display</p>
          <p className="pl-ds-type-sans">Inter · Body / UI</p>
          <p className="pl-ds-type-mono">SPACE MONO · LABELS</p>
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Border control</h2>
        <p className="pl-ds-muted">
          Set <code>--card-border: 1px solid #3a3942</code> on the shell to reinstate strokes on TV solids and
          staff cards everywhere. Hairlines on controls still use <code>--card-edge</code>.
        </p>
      </section>
    </div>
  )
}
