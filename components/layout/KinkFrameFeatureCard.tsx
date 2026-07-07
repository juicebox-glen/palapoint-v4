/** Single tall feature card — height matches the four-card bookings stack. */
export function KinkFrameFeatureCard() {
  return (
    <article className="kink-frame-court-card kink-frame-court-card--busy kink-frame-feature-card kink-frame-broadcast-item kink-frame-broadcast-item--2">
      <p className="kink-frame-feature-card-eyebrow">Now playing</p>
      <h3 className="kink-frame-feature-card-title">Court 02</h3>

      <div className="kink-frame-feature-card-matchup">
        <div className="kink-frame-feature-card-team">
          <span className="kink-frame-feature-card-team-name">Noble / Shaw</span>
          <span className="kink-frame-feature-card-team-score">6</span>
        </div>
        <span className="kink-frame-feature-card-vs" aria-hidden>
          vs
        </span>
        <div className="kink-frame-feature-card-team">
          <span className="kink-frame-feature-card-team-name">Reid / Moss</span>
          <span className="kink-frame-feature-card-team-score">4</span>
        </div>
      </div>

      <div className="kink-frame-court-card-divider" />

      <div className="kink-frame-feature-card-footer">
        <p className="kink-frame-feature-card-meta">
          Set 2 · <strong>Golden point</strong>
        </p>
        <div className="kink-frame-court-card-progress" aria-hidden>
          <span style={{ width: '62%' }} />
        </div>
      </div>
    </article>
  )
}
