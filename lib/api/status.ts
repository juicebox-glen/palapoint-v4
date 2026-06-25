export type StatusRecentGame = {
  id: string
  court: string
  venue: string
  at: string
  status: string
}

export type StatusPayload = {
  gamesToday: number
  gamesThisWeek: number
  playingNow: number
  lastActivity: string | null
  recent: StatusRecentGame[]
}
