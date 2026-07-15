import { PalaLiveAvatar } from '@/components/palalive/PalaLiveAvatar'
import { PalaLiveDsNav } from './PalaLiveDsNav'

import '@/app/styles/palalive-tokens.css'
import '@/app/styles/palalive-staff.css'
import '@/app/styles/palalive-avatar.css'

export default function PalaLiveComponentsPage() {
  return (
    <div className="pl-ds-shell palalive-staff-shell">
      <PalaLiveDsNav active="/design-system/palalive/components" />

      <header className="pl-ds-header">
        <h1>Components</h1>
        <p>
          Staff primitives from <code>palalive-staff-*</code>. Previews use the same classes as production — tweak CSS,
          refresh here.
        </p>
      </header>

      <section className="pl-ds-section">
        <h2>Buttons</h2>
        <div className="pl-ds-row">
          <button type="button" className="palalive-staff-btn palalive-staff-btn--primary">
            Primary
          </button>
          <button type="button" className="palalive-staff-btn palalive-staff-btn--secondary">
            Secondary
          </button>
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Pills</h2>
        <div className="palalive-staff-pill-row">
          <button type="button" className="palalive-staff-pill">
            6
          </button>
          <button type="button" className="palalive-staff-pill is-active">
            8
          </button>
          <button type="button" className="palalive-staff-pill">
            10
          </button>
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Card</h2>
        <div className="palalive-staff-card" style={{ maxWidth: 420 }}>
          <span className="palalive-staff-card-label">Players</span>
          <p className="palalive-staff-card-hint" style={{ margin: 0 }}>
            Charcoal raised surface · <code>--card</code> / no stroke by default.
          </p>
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Avatar</h2>
        <div className="pl-ds-row">
          <PalaLiveAvatar name="Glen Noble" photoUrl={null} />
          <PalaLiveAvatar name="Alex Read" photoUrl={null} />
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Scoreboard (staff)</h2>
        <div className="palalive-staff-scoreboard" style={{ maxWidth: 420 }}>
          <div className="palalive-staff-scoreboard-cols">
            <div className="palalive-staff-scoreboard-col is-serving">
              <span className="palalive-staff-scoreboard-team-name">NOB / AND</span>
              <span className="palalive-staff-scoreboard-point">40</span>
              <div className="palalive-staff-scoreboard-set-dots">
                <span className="palalive-staff-scoreboard-set-dot is-won" />
                <span className="palalive-staff-scoreboard-set-dot" />
              </div>
            </div>
            <div className="palalive-staff-scoreboard-col is-alt">
              <span className="palalive-staff-scoreboard-team-name">WAT / PET</span>
              <span className="palalive-staff-scoreboard-point">30</span>
              <div className="palalive-staff-scoreboard-set-dots">
                <span className="palalive-staff-scoreboard-set-dot" />
                <span className="palalive-staff-scoreboard-set-dot" />
              </div>
            </div>
          </div>
          <div className="palalive-staff-scoreboard-games">
            <span>4</span>
            <span className="palalive-staff-scoreboard-games-dash">–</span>
            <span>2</span>
          </div>
        </div>
      </section>

      <section className="pl-ds-section">
        <h2>Footer CTA pattern</h2>
        <p className="pl-ds-muted">
          Setup / confirm screens: scrollable <code>.palalive-staff-body</code> + pinned{' '}
          <code>.palalive-staff-footer</code> (see Screens → Showcase Confirm).
        </p>
        <div className="palalive-staff-footer" style={{ maxWidth: 420, position: 'relative' }}>
          <button type="button" className="palalive-staff-btn palalive-staff-btn--secondary">
            Edit Match
          </button>
          <button type="button" className="palalive-staff-btn palalive-staff-btn--primary">
            Start Match
          </button>
        </div>
      </section>
    </div>
  )
}
