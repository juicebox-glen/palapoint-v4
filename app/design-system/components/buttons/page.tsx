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
        <h2>Control Panel Buttons</h2>
        <p>Full-width buttons used in staff control panel</p>

        <div className="ds-component-demo" style={{ maxWidth: '375px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button type="button" className="preview-btn preview-btn-secondary">
              EDIT MATCH
            </button>
            <button type="button" className="preview-btn preview-btn-primary">
              START MATCH
            </button>
          </div>
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
