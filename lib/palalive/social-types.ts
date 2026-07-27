export type SocialNightPhase = 'pregame' | 'ingame' | 'postgame'

export interface SocialNightMatchPlayer {
  name: string
  photoUrl: string | null
}

export interface SocialNightMatch {
  id: string
  courtLabel: string
  status: string
  teamA: { players: SocialNightMatchPlayer[]; score: number | null }
  teamB: { players: SocialNightMatchPlayer[]; score: number | null }
}

export interface SocialNightPlayer {
  id: string
  name: string
  photoUrl: string | null
  /** Cumulative Americano points — meaningful for ingame/postgame only. */
  totalPoints: number
  /** 1-based position in the standings — meaningful for ingame/postgame only. */
  rank: number
  /** Places moved since the current round started; null = no change or unknown. */
  rankDelta: number | null
}

export interface SocialNightEventData {
  phase: SocialNightPhase
  eventName: string
  /** e.g. 'americano' — raw event format, for pregame's "Americano · N players · N courts" line. */
  format: string
  courtLabels: string[]
  roundNumber: number
  totalRounds: number
  matches: SocialNightMatch[]
  /** Pregame roster — no rank/points yet. */
  roster: SocialNightPlayer[]
  /** Ranked standings — populated for ingame/postgame. */
  standings: SocialNightPlayer[]
}
