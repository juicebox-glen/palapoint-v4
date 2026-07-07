/**
 * Kink-frame v2 layout geometry — fixed 1920×1080 (16:9).
 *
 * Corner math:
 * - Frame border width B on straight edges
 * - Square outer frame (Rₒ = 0)
 * - Inner content corner radius Rᵢ = B (offset fillet for uniform border at 90° corners)
 */

export const KINK_FRAME_V2_VIEWBOX = { width: 1920, height: 1080 } as const

export const KINK_FRAME_V2_BORDER = 20
export const KINK_FRAME_V2_KINK_HEIGHT = 140

/** Outer frame corner radius — 0 = square TV bezel. */
export const KINK_FRAME_V2_OUTER_RADIUS = 0

/** Inner radius from outer radius and border (square outer → Rᵢ = B). */
export function kinkFrameV2InnerRadius(outerRadius: number, border: number): number {
  if (outerRadius <= 0) return border
  return Math.max(0, outerRadius - border)
}

export const KINK_FRAME_V2_INNER_RADIUS = kinkFrameV2InnerRadius(
  KINK_FRAME_V2_OUTER_RADIUS,
  KINK_FRAME_V2_BORDER,
)

/** Padding inside the content window for the bottom-left logo. */
export const KINK_FRAME_V2_LOGO_GUTTER = 28

/** Logo offset from stage edges — border + gutter (design px). */
export const KINK_FRAME_V2_LOGO_INSET = KINK_FRAME_V2_BORDER + KINK_FRAME_V2_LOGO_GUTTER

/** Content bottom on the right — 1080 − kink height. */
export const KINK_FRAME_V2_KINK_TOP = 1080 - KINK_FRAME_V2_KINK_HEIGHT

/**
 * Kink S-curve anchor points (top sits slightly right of bottom — not stacked).
 * Upper shelf ends at stepX; bottom edge resumes at curveEndX.
 */
export const KINK_FRAME_V2_KINK_STEP_X = 1615
export const KINK_FRAME_V2_KINK_CURVE_END_X = 1510

/**
 * Cubic-bezier tangent lengths — horizontal pulls at each anchor.
 */
export const KINK_FRAME_V2_KINK_HANDLE_TOP = 85
export const KINK_FRAME_V2_KINK_HANDLE_BOTTOM = 105

const { width, height } = KINK_FRAME_V2_VIEWBOX
const b = KINK_FRAME_V2_BORDER
const rIn = KINK_FRAME_V2_INNER_RADIUS
const kinkTop = KINK_FRAME_V2_KINK_TOP
const stepX = KINK_FRAME_V2_KINK_STEP_X
const curveEndX = KINK_FRAME_V2_KINK_CURVE_END_X
const handleTop = KINK_FRAME_V2_KINK_HANDLE_TOP
const handleBottom = KINK_FRAME_V2_KINK_HANDLE_BOTTOM

/** Inner content rect — inset B px from outer on straight edges. */
const innerLeft = b
const innerTop = b
const innerRight = width - b
const innerBottom = height - b

/** Smooth S-curve — upper anchor (stepX, kinkTop) is right of lower anchor (curveEndX, innerBottom). */
const kinkSCurve = `C ${stepX - handleTop} ${kinkTop} ${curveEndX + handleBottom} ${innerBottom} ${curveEndX} ${innerBottom}`

/**
 * Inner content boundary — media mask + frame hole (clockwise for even-odd cutout).
 * Corner arcs radius Rᵢ on the inset rect.
 */
export const KINK_FRAME_V2_CONTENT_PATH = [
  `M ${innerLeft + rIn} ${innerTop}`,
  `H ${innerRight - rIn}`,
  `A ${rIn} ${rIn} 0 0 1 ${innerRight} ${innerTop + rIn}`,
  `V ${kinkTop - rIn}`,
  `A ${rIn} ${rIn} 0 0 1 ${innerRight - rIn} ${kinkTop}`,
  `H ${stepX}`,
  kinkSCurve,
  `H ${innerLeft + rIn}`,
  `A ${rIn} ${rIn} 0 0 1 ${innerLeft} ${innerBottom - rIn}`,
  `V ${innerTop + rIn}`,
  `A ${rIn} ${rIn} 0 0 1 ${innerLeft + rIn} ${innerTop}`,
  'Z',
].join(' ')

/** Square outer rect minus inner hole. */
export const KINK_FRAME_V2_OVERLAY_PATH = [
  `M 0 0`,
  `H ${width}`,
  `V ${height}`,
  `H 0`,
  'Z',
  KINK_FRAME_V2_CONTENT_PATH,
].join(' ')

/** Skeleton / venue frame colours. */
export const KINK_FRAME_V2_SKELETON_COLORS = {
  frame: '#0E1116',
  content: '#2d343e',
  matte: '#1a1a1a',
} as const

/** Bottom-right frame pocket (viewBox px). */
export const KINK_FRAME_V2_NOTCH = {
  top: kinkTop,
  bottom: height,
  left: curveEndX,
  right: width,
} as const

export function kinkFrameV2ContentMaskUrl(): string {
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}">`,
    `<path fill="#fff" d="${KINK_FRAME_V2_CONTENT_PATH}"/>`,
    '</svg>',
  ].join('')
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
