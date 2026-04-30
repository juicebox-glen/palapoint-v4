/**
 * Shared score display formatting for match state.
 */

/** Re-exported from `./player-names` (delegates to `name-format`). */
import { abbreviateSurname } from './player-names'

export { abbreviateSurname }

export function formatPointDisplay(
  points: number,
  opponentPoints: number,
  isTiebreak: boolean,
  tiebreakScore?: number
): string {
  if (isTiebreak && tiebreakScore !== undefined) {
    return tiebreakScore.toString()
  }

  const pointLabels = ['0', '15', '30', '40']

  if (points <= 3) {
    return pointLabels[points]
  }

  if (points >= 3 && opponentPoints >= 3) {
    if (points - opponentPoints === 1) return 'Ad'
    if (points === opponentPoints) return '40'
    if (opponentPoints - points === 1) return '40'
  }

  return '40'
}

export function buildTeamName(
  player1: string | null | undefined,
  player2: string | null | undefined,
  fallback: string
): string {
  const names: string[] = []
  if (player1) names.push(player1)
  if (player2) names.push(player2)
  if (names.length === 0) return fallback
  if (names.length === 1) return names[0]
  return `${names[0]} / ${names[1]}`
}

/** Team name built from abbreviated surnames only (e.g. "SMI / DOE"). */
export function buildTeamNameAbbreviated(
  player1: string | null | undefined,
  player2: string | null | undefined,
  fallback: string
): string {
  const abbrevs: string[] = []
  if (player1) abbrevs.push(abbreviateSurname(player1))
  if (player2) abbrevs.push(abbreviateSurname(player2))
  if (abbrevs.length === 0) return fallback
  if (abbrevs.length === 1) return abbrevs[0]
  return `${abbrevs[0]} / ${abbrevs[1]}`
}

/**
 * Format game duration as MM:SS from started_at.
 * If endAt is provided (e.g. completed_at), uses that as end time.
 */
export function formatGameDuration(
  startedAt: string | null | undefined,
  endAt?: string | null
): string {
  if (!startedAt) return '0:00'
  const start = new Date(startedAt).getTime()
  const end = endAt ? new Date(endAt).getTime() : Date.now()
  const elapsedMs = Math.max(0, end - start)
  const mins = Math.floor(elapsedMs / 60000)
  const secs = Math.floor((elapsedMs % 60000) / 1000)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Get horizontal score parts for spectator display: [set1, set2?, ...] [games] [points]
 * e.g. [6, 3, 15] for 6 games set1, 3 games set2, 15 points
 */
export function getHorizontalScoreParts(
  setScores: Array<{ team_a: number; team_b: number }> | undefined,
  team: 'a' | 'b',
  games: number,
  points: number,
  opponentPoints: number,
  isTiebreak: boolean,
  tiebreakScore?: number
): (string | number)[] {
  const parts: (string | number)[] = []
  if (setScores?.length) {
    setScores.forEach((s) => parts.push(team === 'a' ? s.team_a : s.team_b))
  }
  parts.push(games)
  parts.push(
    formatPointDisplay(points, opponentPoints, isTiebreak, tiebreakScore)
  )
  return parts
}
