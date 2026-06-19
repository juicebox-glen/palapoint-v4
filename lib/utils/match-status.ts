import type { MatchState } from '@/lib/types/match'

type MatchStatusFields = Pick<MatchState, 'status' | 'winner'>

/** Staff, court hardware, and spectator endgame — excludes live setup/in_progress. */
export function isMatchEndgame(match: MatchStatusFields): boolean {
  if (match.status === 'completed' || match.status === 'abandoned') return true
  if (match.winner == null) return false
  return match.status !== 'setup' && match.status !== 'in_progress'
}

/** Player phone post-game — any winner or terminal status. */
export function isMatchPostGame(match: MatchStatusFields): boolean {
  return match.status === 'completed' || match.status === 'abandoned' || match.winner != null
}
