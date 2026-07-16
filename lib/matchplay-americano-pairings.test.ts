// ============================================================
// AMERICANO PAIRINGS — venue-supported counts (8 / 12 / 16)
// Run with: npx ts-node lib/matchplay-americano-pairings.test.ts
// ============================================================

import { generateAmericanoPairings, type AmericanoPairingRound } from './matchplay-americano-pairings'
import { minCourtsForAmericano } from './matchplay-americano-setup'

let testsPassed = 0
let testsFailed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
    testsPassed++
  } catch (error: unknown) {
    console.log(`✗ ${name}`)
    console.log(`  Error: ${error instanceof Error ? error.message : String(error)}`)
    testsFailed++
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

function playerIds(n: number): string[] {
  return Array.from({ length: n }, (_, i) => `p${i + 1}`)
}

function courtLabels(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `Court ${i + 1}`)
}

function assertNoCourtCollisions(rounds: AmericanoPairingRound[]) {
  for (const round of rounds) {
    const labels = round.matches.map((m) => m.court_label)
    const unique = new Set(labels)
    assert(unique.size === labels.length, `Round ${round.roundNumber}: duplicate court labels ${labels.join(', ')}`)
  }
}

function countMatchesPerPlayer(rounds: AmericanoPairingRound[], ids: string[]): Record<string, number> {
  const counts = Object.fromEntries(ids.map((id) => [id, 0])) as Record<string, number>
  for (const round of rounds) {
    for (const match of round.matches) {
      for (const id of [...match.team_a, ...match.team_b]) {
        counts[id] = (counts[id] ?? 0) + 1
      }
    }
  }
  return counts
}

function assertEqualPlay(rounds: AmericanoPairingRound[], ids: string[]) {
  const counts = Object.values(countMatchesPerPlayer(rounds, ids))
  const min = Math.min(...counts)
  const max = Math.max(...counts)
  assert(min === max, `Uneven play counts: min ${min}, max ${max} (${counts.join(', ')})`)
}

console.log('\n=== Americano pairings (venue counts) ===\n')

for (const n of [8, 12, 16] as const) {
  const courts = minCourtsForAmericano(n)
  const ids = playerIds(n)
  const labels = courtLabels(courts)

  test(`${n} players / ${courts} courts — no court collisions`, () => {
    const rounds = generateAmericanoPairings(ids, labels)
    assert(rounds.length === n - 1, `Expected ${n - 1} rounds, got ${rounds.length}`)
    for (const round of rounds) {
      assert(round.matches.length === courts, `Round ${round.roundNumber}: expected ${courts} matches`)
    }
    assertNoCourtCollisions(rounds)
  })

  test(`${n} players / ${courts} courts — everyone plays every round`, () => {
    const rounds = generateAmericanoPairings(ids, labels)
    assertEqualPlay(rounds, ids)
    const counts = countMatchesPerPlayer(rounds, ids)
    for (const id of ids) {
      assert(counts[id] === n - 1, `${id} expected ${n - 1} matches, got ${counts[id]}`)
    }
  })
}

test('12 players / 2 courts — rejected (audit T2)', () => {
  let threw = false
  try {
    generateAmericanoPairings(playerIds(12), courtLabels(2))
  } catch (e) {
    threw = true
    assert(
      e instanceof Error && e.message.includes('needs at least 3 courts'),
      `Unexpected error: ${e}`
    )
  }
  assert(threw, 'Expected error for too few courts')
})

test('16 players / 3 courts — rejected', () => {
  let threw = false
  try {
    generateAmericanoPairings(playerIds(16), courtLabels(3))
  } catch {
    threw = true
  }
  assert(threw, 'Expected error for too few courts')
})

console.log(`\n${testsPassed} passed, ${testsFailed} failed\n`)
if (testsFailed > 0) process.exit(1)
