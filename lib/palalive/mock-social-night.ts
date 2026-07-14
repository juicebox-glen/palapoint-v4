import type { SocialNightEventData, SocialNightMatch, SocialNightPlayer } from './social-types'

const PHOTO = (name: string) => `/images/palalive/players/${name}.jpg`

const ROSTER_NAMES = [
  ['Glen Noble', PHOTO('glen')],
  ['Robert Anderson', null],
  ['Alex Read', null],
  ['Dave Smith', null],
  ['Marcus Herrara', PHOTO('marcus')],
  ['Sam Wilson', null],
  ['Jake Thomas', null],
  ['Josh Kyte', PHOTO('josh')],
  ['Carl Pettitt', PHOTO('carl')],
  ['Mike Brown', null],
] as const

function mockMatches(completedCourt4: boolean): SocialNightMatch[] {
  const pair = (a: string, aPhoto: string | null, b: string, bPhoto: string | null) => [
    { name: a, photoUrl: aPhoto },
    { name: b, photoUrl: bPhoto },
  ]

  const base: SocialNightMatch[] = [
    {
      id: 'm1',
      courtLabel: '01',
      status: 'in_progress',
      teamA: { players: pair('Glen Noble', PHOTO('glen'), 'Marcus Herrara', PHOTO('marcus')), score: null },
      teamB: { players: pair('Robert Anderson', null, 'Carl Pettitt', PHOTO('carl')), score: null },
    },
    {
      id: 'm2',
      courtLabel: '02',
      status: 'in_progress',
      teamA: { players: pair('Glen Noble', PHOTO('glen'), 'Marcus Herrara', PHOTO('marcus')), score: null },
      teamB: { players: pair('Robert Anderson', null, 'Carl Pettitt', PHOTO('carl')), score: null },
    },
    {
      id: 'm3',
      courtLabel: '03',
      status: 'in_progress',
      teamA: { players: pair('Glen Noble', PHOTO('glen'), 'Marcus Herrara', PHOTO('marcus')), score: null },
      teamB: { players: pair('Robert Anderson', null, 'Carl Pettitt', PHOTO('carl')), score: null },
    },
    {
      id: 'm4',
      courtLabel: '04',
      status: completedCourt4 ? 'completed' : 'in_progress',
      teamA: {
        players: pair('Glen Noble', PHOTO('glen'), 'Marcus Herrara', PHOTO('marcus')),
        score: completedCourt4 ? 13 : null,
      },
      teamB: {
        players: pair('Robert Anderson', null, 'Carl Pettitt', PHOTO('carl')),
        score: completedCourt4 ? 5 : null,
      },
    },
  ]
  return base
}

function finalMatches(): SocialNightMatch[] {
  return mockMatches(false).map((m) => ({
    ...m,
    status: 'completed',
    teamA: { ...m.teamA, score: 13 },
    teamB: { ...m.teamB, score: 5 },
  }))
}

export const MOCK_SOCIAL_PREGAME: SocialNightEventData = {
  phase: 'pregame',
  eventName: 'Thursday Night Americano',
  roundNumber: 1,
  totalRounds: 8,
  matches: mockMatches(false),
  roster: ROSTER_NAMES.map(([name, photoUrl], i): SocialNightPlayer => ({
    id: `p${i}`,
    name,
    photoUrl,
    totalPoints: 0,
    rank: 0,
    rankDelta: null,
  })),
  standings: [],
}

export const MOCK_SOCIAL_INGAME: SocialNightEventData = {
  phase: 'ingame',
  eventName: 'Thursday Night Americano',
  roundNumber: 4,
  totalRounds: 8,
  matches: mockMatches(true),
  roster: [],
  standings: [
    { id: 'p1', name: 'Robert Anderson', photoUrl: null, totalPoints: 26, rank: 1, rankDelta: null },
    { id: 'p2', name: 'Alex Read', photoUrl: null, totalPoints: 19, rank: 2, rankDelta: 2 },
    { id: 'p3', name: 'Dave Smith', photoUrl: null, totalPoints: 17, rank: 3, rankDelta: -1 },
    { id: 'p4', name: 'Marcus Herrara', photoUrl: PHOTO('marcus'), totalPoints: 14, rank: 4, rankDelta: null },
    { id: 'p0', name: 'Glen Noble', photoUrl: PHOTO('glen'), totalPoints: 12, rank: 5, rankDelta: null },
    { id: 'p5', name: 'Sam Wilson', photoUrl: null, totalPoints: 9, rank: 6, rankDelta: 1 },
    { id: 'p8', name: 'Carl Pettitt', photoUrl: PHOTO('carl'), totalPoints: 8, rank: 7, rankDelta: 3 },
    { id: 'p6', name: 'Jake Thomas', photoUrl: null, totalPoints: 7, rank: 8, rankDelta: null },
    { id: 'p7', name: 'Josh Kyte', photoUrl: PHOTO('josh'), totalPoints: 5, rank: 9, rankDelta: -2 },
    { id: 'p9', name: 'Mike Brown', photoUrl: null, totalPoints: 3, rank: 10, rankDelta: null },
  ],
}

export const MOCK_SOCIAL_POSTGAME: SocialNightEventData = {
  phase: 'postgame',
  eventName: 'Thursday Night Americano',
  roundNumber: 8,
  totalRounds: 8,
  matches: finalMatches(),
  roster: [],
  standings: MOCK_SOCIAL_INGAME.standings.map((p) => ({ ...p, rankDelta: null })),
}
