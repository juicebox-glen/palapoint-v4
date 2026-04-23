/**
 * Top-down padel court outline for matchplay court selector.
 * Layout: outer rectangle; three full-width horizontals (~⅕, centre net, ~⅕ from bottom);
 * one vertical bisector only between the two service lines (not through back courts).
 */
export function CourtIcon() {
  const pad = 2
  const w = 56
  const h = 76
  const x0 = pad
  const y0 = pad
  const x1 = x0 + w
  const y1 = y0 + h
  const midX = x0 + w / 2
  const fifth = h / 5
  const yTopService = y0 + fifth
  const yNet = y0 + h / 2
  const yBottomService = y1 - fifth

  return (
    <svg
      viewBox="0 0 60 80"
      className="matchplay-court-icon"
      fill="none"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <g className="matchplay-court-icon-lines" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="miter">
        {/* Outer boundary — sharp corners */}
        <rect x={x0} y={y0} width={w} height={h} rx={0} />
        {/* Top service line */}
        <line x1={x0} y1={yTopService} x2={x1} y2={yTopService} />
        {/* Net / centre */}
        <line x1={x0} y1={yNet} x2={x1} y2={yNet} />
        {/* Bottom service line */}
        <line x1={x0} y1={yBottomService} x2={x1} y2={yBottomService} />
        {/* Centre vertical: service band only (not into back courts) */}
        <line x1={midX} y1={yTopService} x2={midX} y2={yBottomService} />
      </g>
    </svg>
  )
}
