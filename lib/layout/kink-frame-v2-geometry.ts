/**
 * Kink-frame v2 layout geometry — fixed 1920×1080 (16:9).
 *
 * Spec (mockup):
 * - 20px frame border on straight edges
 * - Bottom-right kink pocket height 140px (content step at y = 940)
 * - 40px outer corner radius → 20px inner content corner radius
 */

export const KINK_FRAME_V2_VIEWBOX = { width: 1920, height: 1080 } as const

export const KINK_FRAME_V2_BORDER = 20
export const KINK_FRAME_V2_KINK_HEIGHT = 140
export const KINK_FRAME_V2_OUTER_RADIUS = 40
export const KINK_FRAME_V2_INNER_RADIUS = KINK_FRAME_V2_OUTER_RADIUS - KINK_FRAME_V2_BORDER

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
const rOut = KINK_FRAME_V2_OUTER_RADIUS
const rIn = KINK_FRAME_V2_INNER_RADIUS
const kinkTop = KINK_FRAME_V2_KINK_TOP
const stepX = KINK_FRAME_V2_KINK_STEP_X
const curveEndX = KINK_FRAME_V2_KINK_CURVE_END_X
const handleTop = KINK_FRAME_V2_KINK_HANDLE_TOP
const handleBottom = KINK_FRAME_V2_KINK_HANDLE_BOTTOM
const innerRight = width - b
const innerBottom = height - b
const innerTop = b
const innerLeft = b

/** Smooth S-curve — upper anchor (stepX, kinkTop) is right of lower anchor (curveEndX, innerBottom). */
const kinkSCurve = `C ${stepX - handleTop} ${kinkTop} ${curveEndX + handleBottom} ${innerBottom} ${curveEndX} ${innerBottom}`

/** Inner content boundary — media is masked/clipped to this shape. */
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

/** Outer rounded rect minus inner hole — frame overlay on top of content. */
export const KINK_FRAME_V2_OVERLAY_PATH = [
  `M 0 ${rOut}`,
  `A ${rOut} ${rOut} 0 0 1 ${rOut} 0`,
  `H ${width - rOut}`,
  `A ${rOut} ${rOut} 0 0 1 ${width} ${rOut}`,
  `V ${height - rOut}`,
  `A ${rOut} ${rOut} 0 0 1 ${width - rOut} ${height}`,
  `H ${rOut}`,
  `A ${rOut} ${rOut} 0 0 1 0 ${height - rOut}`,
  'Z',
  KINK_FRAME_V2_CONTENT_PATH,
].join(' ')

/** Mockup colours for skeleton verification. */
export const KINK_FRAME_V2_SKELETON_COLORS = {
  frame: '#e91e63',
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
