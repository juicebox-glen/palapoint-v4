/** Canonical lounge / spectator TV output (1080p). */
export const TV_VIEWPORT_WIDTH = 1920
export const TV_VIEWPORT_HEIGHT = 1080

export const TV_VIEWPORT = {
  width: TV_VIEWPORT_WIDTH,
  height: TV_VIEWPORT_HEIGHT,
} as const

/** On-court display — AOC Q32V4 and matching 1440p 16:9 panels (2560×1440). */
export const COURT_VIEWPORT_WIDTH = 2560
export const COURT_VIEWPORT_HEIGHT = 1440

export const COURT_VIEWPORT = {
  width: COURT_VIEWPORT_WIDTH,
  height: COURT_VIEWPORT_HEIGHT,
} as const

export type DisplayViewport = typeof TV_VIEWPORT | typeof COURT_VIEWPORT
