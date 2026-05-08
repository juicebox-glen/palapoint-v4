/** LocalStorage shape for matchplay hub round cap (aligned with /matchplay/new). */
export interface MatchplayHubStoredSettings {
  courtCount?: number
  maxScore?: number
  maxScoreCustom?: number
  rounds: number
  roundsCustom?: number
}

const SETTINGS_KEY = 'palapoint_matchplay_settings'

export function loadMatchplayHubSettings(): MatchplayHubStoredSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem(SETTINGS_KEY)
    if (stored) return JSON.parse(stored) as MatchplayHubStoredSettings
  } catch (_) {}
  return null
}

export function getMatchplayTotalRoundsFromStorage(): number {
  const s = loadMatchplayHubSettings()
  if (!s) return 4
  return s.rounds === 0 ? (s.roundsCustom ?? 4) : s.rounds
}

/** Americano: everyone partners with everyone once. Circle method. */
export function generateAmericanoPairings(
  playerIds: string[],
  courtLabels: string[]
): { roundNumber: number; matches: { court_label: string; team_a: string[]; team_b: string[] }[]; resting?: string }[] {
  const result: {
    roundNumber: number
    matches: { court_label: string; team_a: string[]; team_b: string[] }[]
    resting?: string
  }[] = []
  const n = playerIds.length
  const hasBye = n % 2 !== 0
  const playerList = hasBye ? [...playerIds, null as unknown as string] : [...playerIds]
  const total = playerList.length
  const fixed = playerList[0]!
  const rotating = playerList.slice(1)
  const numCourts = Math.max(1, Math.floor(total / 4))
  const courts =
    courtLabels.length > 0 ? courtLabels.slice(0, numCourts) : Array.from({ length: numCourts }, (_, i) => `Court ${i + 1}`)

  for (let round = 0; round < total - 1; round++) {
    const currentOrder = [fixed, ...rotating]
    const pairs: [string, string][] = []
    let resting: string | undefined

    for (let i = 0; i < total / 2; i++) {
      const p1 = currentOrder[i]
      const p2 = currentOrder[total - 1 - i]
      if (p1 != null && p2 != null) {
        pairs.push([p1, p2])
      } else {
        resting = (p1 ?? p2) as string
      }
    }

    const matches: { court_label: string; team_a: string[]; team_b: string[] }[] = []
    for (let i = 0; i < pairs.length - 1; i += 2) {
      const courtIdx = Math.floor(i / 2) % courts.length
      matches.push({
        court_label: courts[courtIdx] ?? `Court ${courtIdx + 1}`,
        team_a: pairs[i]!,
        team_b: pairs[i + 1]!,
      })
    }

    result.push({ roundNumber: round + 1, matches, resting })

    rotating.push(rotating.shift()!)
  }

  return result
}
