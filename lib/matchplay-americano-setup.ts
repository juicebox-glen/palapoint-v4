/** Player counts supported for venue Americano (8 / 12 / 16). */
export const MATCHPLAY_AMERICANO_PLAYER_OPTIONS = [8, 12, 16] as const

export type MatchplayAmericanoPlayerCount = (typeof MATCHPLAY_AMERICANO_PLAYER_OPTIONS)[number]

/** Minimum courts so every match in a round gets a unique court. */
export function minCourtsForAmericano(playerCount: number): number {
  return Math.max(1, Math.floor(playerCount / 4))
}

/** Default court selection when player count changes on setup. */
export function recommendedCourtsForAmericano(playerCount: number): number[] {
  const n = minCourtsForAmericano(playerCount)
  return Array.from({ length: n }, (_, i) => i + 1)
}

export function isSupportedAmericanoPlayerCount(
  playerCount: number
): playerCount is MatchplayAmericanoPlayerCount {
  return (MATCHPLAY_AMERICANO_PLAYER_OPTIONS as readonly number[]).includes(playerCount)
}

export function hasEnoughCourtsForAmericano(playerCount: number, selectedCourts: number[]): boolean {
  return selectedCourts.length >= minCourtsForAmericano(playerCount)
}
