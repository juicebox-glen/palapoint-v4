/** Shared round picker for Social Night TV (+ legacy MatchplayBoard). */

export type MatchplayRoundPhase = 'pregame' | 'ingame' | 'postgame'

export interface SelectableRound {
  round_number: number
  status: string
}

/**
 * Pick which round's fixtures the venue screen (or board) should show.
 * Rounds must be sorted ascending by `round_number`. Americano pre-creates all
 * rounds — never use "highest round number" while play is in progress.
 */
export function selectCurrentMatchplayRound<T extends SelectableRound>(
  roundsAsc: T[],
  phase: MatchplayRoundPhase
): T | null {
  if (roundsAsc.length === 0) return null

  if (phase === 'pregame') {
    return roundsAsc.find((r) => r.round_number === 1) ?? roundsAsc[0] ?? null
  }

  if (phase === 'postgame') {
    return roundsAsc[roundsAsc.length - 1] ?? null
  }

  // Live: TV follows the round staff has started.
  // Between rounds (N completed, N+1 still pending) hold the finished round with
  // scores until staff taps Next Round → start_round — don't preview fixtures early.
  const inProgress = roundsAsc.find((r) => r.status === 'in_progress')
  if (inProgress) return inProgress

  const latestCompleted = [...roundsAsc].reverse().find((r) => r.status === 'completed')
  const hasPendingAhead =
    latestCompleted != null &&
    roundsAsc.some(
      (r) => r.round_number > latestCompleted.round_number && r.status !== 'completed'
    )
  if (latestCompleted && hasPendingAhead) return latestCompleted

  return (
    roundsAsc.find((r) => r.status !== 'completed') ??
    roundsAsc[roundsAsc.length - 1] ??
    null
  )
}

export function phaseFromEventStatus(status: string | undefined): MatchplayRoundPhase {
  if (status === 'completed') return 'postgame'
  if (status === 'in_progress') return 'ingame'
  return 'pregame'
}
