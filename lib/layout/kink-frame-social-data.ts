/** Demo game-night metadata for kink-frame social panel. */
export const KINK_FRAME_SOCIAL_GAME = {
  title: 'Thursday Social',
  format: 'Americano',
  time: '19:00',
  playerCount: 9,
  courtCount: 4,
  round: 3,
  totalRounds: 5,
} as const

/** Current round fixtures — four courts in a 2×2 grid. */
export const KINK_FRAME_SOCIAL_FIXTURES = [
  {
    id: '1',
    court: 'Court 1',
    teamA: ['Glen Noble', 'Julian Waters'] as const,
    teamB: ['Rob Anderson', 'Carl Pettit'] as const,
  },
  {
    id: '2',
    court: 'Court 2',
    teamA: ['Sam Wilson', 'Jake Thomas'] as const,
    teamB: ['Mike Brown', 'Tom Davis'] as const,
  },
  {
    id: '3',
    court: 'Court 3',
    teamA: ['Sara Chen', 'Priya Patel'] as const,
    teamB: ['Mia Lee', 'Owen Wright'] as const,
  },
  {
    id: '4',
    court: 'Court 4',
    teamA: ['Glen Noble', 'Rob Anderson'] as const,
    teamB: ['Julian Waters', 'Carl Pettit'] as const,
  },
] as const

export type KinkFrameSocialStanding = {
  id: string
  name: string
  /** Game differential (+ / −). */
  points: number
  photoUrl: string | null
  /** Positions moved since last round (+ up, − down, 0 unchanged). */
  positionChange: number
}

/** Demo standings for the social night leaderboard. */
export const KINK_FRAME_SOCIAL_STANDINGS: readonly KinkFrameSocialStanding[] = [
  { id: '1', name: 'Glen Noble', points: 18, photoUrl: null, positionChange: 1 },
  { id: '2', name: 'Sara Chen', points: 14, photoUrl: null, positionChange: -1 },
  { id: '3', name: 'Julian Waters', points: 11, photoUrl: null, positionChange: 2 },
  { id: '4', name: 'Priya Patel', points: 7, photoUrl: null, positionChange: 0 },
  { id: '5', name: 'Rob Anderson', points: 3, photoUrl: null, positionChange: -2 },
  { id: '6', name: 'Mia Lee', points: -2, photoUrl: null, positionChange: 1 },
  { id: '7', name: 'Owen Wright', points: -6, photoUrl: null, positionChange: -1 },
  { id: '8', name: 'Carl Pettit', points: -6, photoUrl: null, positionChange: 0 },
]
