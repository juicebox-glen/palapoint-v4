import { formatPointDisplay } from '@/lib/utils/score-format'
import { modeBadgeLabel, setsBadgeLabel } from '@/lib/utils/match-labels'
import type { MatchState } from '@/lib/types/match'

export function getGameModeText(mode: string): string {
  switch (mode) {
    case 'golden_point':
      return 'GOLDEN POINT'
    case 'silver_point':
      return 'SILVER POINT'
    case 'traditional':
      return 'TRADITIONAL'
    default:
      return mode.toUpperCase()
  }
}

export function getEndgameSetScores(m: MatchState) {
  if (m.set_scores && m.set_scores.length > 0) return m.set_scores
  return [{ team_a: m.team_a_games ?? 0, team_b: m.team_b_games ?? 0 }]
}

/** @deprecated Use setsBadgeLabel from lib/utils/match-labels */
export const pregameSetsLabel = setsBadgeLabel

/** @deprecated Use modeBadgeLabel from lib/utils/match-labels */
export const pregameModeLabel = modeBadgeLabel

export type SetDotStatus = 'won' | 'lost' | 'pending'

export function getSetIndicators(
  setScores: MatchState['set_scores'] | null | undefined,
  setsToWin: number
): { teamA: SetDotStatus[]; teamB: SetDotStatus[] } {
  const maxSets = Math.max(1, setsToWin * 2 - 1)
  const scores = setScores ?? []
  const teamA: SetDotStatus[] = []
  const teamB: SetDotStatus[] = []

  for (let i = 0; i < maxSets; i++) {
    const set = scores[i]
    if (!set) {
      teamA.push('pending')
      teamB.push('pending')
      continue
    }
    const a = set.team_a ?? 0
    const b = set.team_b ?? 0
    if (a > b) {
      teamA.push('won')
      teamB.push('lost')
    } else if (b > a) {
      teamA.push('lost')
      teamB.push('won')
    } else {
      teamA.push('pending')
      teamB.push('pending')
    }
  }
  return { teamA, teamB }
}

export function formatLivePointDisplay(team: 'a' | 'b', m: MatchState): string {
  const pa = m.team_a_points ?? 0
  const pb = m.team_b_points ?? 0
  const isTb = m.is_tiebreak ?? false
  const raw =
    team === 'a'
      ? formatPointDisplay(pa, pb, isTb, isTb ? m.tiebreak_scores?.team_a : undefined)
      : formatPointDisplay(pb, pa, isTb, isTb ? m.tiebreak_scores?.team_b : undefined)
  if (raw === 'Ad') return 'AD'
  return raw
}
