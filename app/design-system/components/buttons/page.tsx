import Link from 'next/link'

export default function ButtonsPage() {
  return (
    <div className="ds-page">
      <Link href="/design-system" className="ds-back">
        ← Back
      </Link>

      <header className="ds-page-header">
        <h1>Buttons</h1>
        <p>Interactive button styles used throughout the app</p>
      </header>

      <section className="ds-section">
        <h2>Naming</h2>
        <p>
          Prefer BEM-style modifiers on <code>.btn</code> (<code>btn--primary</code>, <code>btn--full</code>) alongside the legacy
          chained names (<code>btn-primary</code>, <code>btn-block</code>) — both map to the same rules in{' '}
          <code>app/styles/components/buttons.css</code>. See <code>docs/ui-components.md</code>.
        </p>
      </section>

      <section className="ds-section">
        <h2>Primary Buttons</h2>
        <p>Used for main actions: Start Match, Continue, Submit</p>

        <div className="ds-component-row">
          <div className="ds-component-demo">
            <button type="button" className="btn btn-primary">
              Start Match
            </button>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <button type="button" className="btn btn-primary">
              Start Match
            </button>
          </div>
        </div>

        <div className="ds-code-block">
          <code>&lt;button className=&quot;btn btn-primary&quot;&gt;Start Match&lt;/button&gt;</code>
        </div>
      </section>

      <section className="ds-section">
        <h2>Secondary Buttons</h2>
        <p>Used for secondary actions: Edit, Back, Cancel</p>

        <div className="ds-component-row">
          <div className="ds-component-demo">
            <button type="button" className="btn btn-secondary">
              Edit Match
            </button>
          </div>
          <div className="ds-component-demo ds-component-demo--dark">
            <button type="button" className="btn btn-secondary">
              Edit Match
            </button>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Danger Buttons</h2>
        <p>Used for destructive actions: End Session, Delete</p>

        <div className="ds-component-row">
          <div className="ds-component-demo">
            <button type="button" className="btn btn-danger">
              End Session
            </button>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Full-width stack (control + setup)</h2>
        <p>
          Staff preview/endgame and player setup primary actions use the same <code>.btn</code> utilities with{' '}
          <code>btn-block</code> for full width.
        </p>

        <div className="ds-component-demo" style={{ maxWidth: '375px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary btn-block">
              EDIT MATCH
            </button>
            <button type="button" className="btn btn-primary btn-block">
              START MATCH
            </button>
          </div>
        </div>
      </section>

      <section className="ds-section">
        <h2>Solid danger</h2>
        <p>
          Session takeover and similar CTAs use <code>btn btn-danger-fill</code> (solid fill, not the outline{' '}
          <code>btn-danger</code>).
        </p>
        <div className="ds-component-demo">
          <button type="button" className="btn btn-danger-fill">
            Take Over
          </button>
        </div>
      </section>

      <section className="ds-section">
        <h2>Button States</h2>

        <div className="ds-component-row">
          <div className="ds-component-demo">
            <button type="button" className="btn btn-primary">
              Default
            </button>
          </div>
          <div className="ds-component-demo">
            <button type="button" className="btn btn-primary" disabled>
              Disabled
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
