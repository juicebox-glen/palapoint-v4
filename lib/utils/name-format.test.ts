/**
 * Name format tests — run with: npx ts-node lib/utils/name-format.test.ts
 */

import {
  formatPlayerName,
  formatTeamDisplay,
  formatTeamScoreboard,
  getPlayerInitials,
  getTeamSurnameRows,
  getSpectatorTeamSurnameRows,
} from './name-format'

let testsPassed = 0
let testsFailed = 0

function test(name: string, fn: () => void) {
  try {
    fn()
    console.log(`✓ ${name}`)
    testsPassed++
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error)
    console.log(`✗ ${name}`)
    console.log(`  Error: ${msg}`)
    testsFailed++
  }
}

function assertEqual(actual: unknown, expected: unknown, message?: string) {
  if (actual !== expected) {
    throw new Error(
      `${message || 'Assertion failed'}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    )
  }
}

test('formatPlayerName full / first / surname_short / initials / abbreviated', () => {
  assertEqual(formatPlayerName('Glen Noble', 'full'), 'Glen Noble')
  assertEqual(formatPlayerName('Glen Noble', 'first'), 'Glen')
  assertEqual(formatPlayerName('Glen Noble', 'surname_short'), 'NOB')
  assertEqual(formatPlayerName('Glen Noble', 'initials'), 'GN')
  assertEqual(formatPlayerName('Glen Noble', 'abbreviated'), 'G. Noble')
})

test('formatPlayerName single token', () => {
  assertEqual(formatPlayerName('Glen', 'full'), 'Glen')
  assertEqual(formatPlayerName('Glen', 'first'), 'Glen')
  assertEqual(formatPlayerName('Glen', 'surname_short'), 'GLE')
  assertEqual(formatPlayerName('Glen', 'initials'), 'GL')
})

test('formatPlayerName empty', () => {
  assertEqual(formatPlayerName('', 'full'), '')
  assertEqual(formatPlayerName(null, 'full'), '')
  assertEqual(formatPlayerName(undefined, 'full'), '')
})

test('formatTeamDisplay', () => {
  assertEqual(formatTeamDisplay('Glen Noble', 'Rob Anderson', 1, 'first'), 'Glen & Rob')
  assertEqual(formatTeamDisplay('Glen', '', 1, 'first'), 'Glen')
  assertEqual(formatTeamDisplay('', '', 1, 'first'), 'Team 1')
})

test('formatTeamScoreboard', () => {
  assertEqual(formatTeamScoreboard('Glen Noble', 'Rob Anderson', 1), 'NOB / AND')
  assertEqual(formatTeamScoreboard('', '', 1), 'TEAM 1')
  assertEqual(formatTeamScoreboard('', '', 2), 'TEAM 2')
})

test('getPlayerInitials', () => {
  assertEqual(getPlayerInitials('Glen Noble'), 'GN')
  assertEqual(getPlayerInitials(''), '?')
})

test('getTeamSurnameRows filters empty', () => {
  assertEqual(getTeamSurnameRows('Ann Smith', '').join('|'), 'SMI')
})

test('getSpectatorTeamSurnameRows team fallback', () => {
  assertEqual(JSON.stringify(getSpectatorTeamSurnameRows('', '', 2)), JSON.stringify(['Team 2']))
})

console.log(`\nName format: ${testsPassed} passed, ${testsFailed} failed`)
if (testsFailed > 0) process.exit(1)
