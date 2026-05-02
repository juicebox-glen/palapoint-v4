/**
 * Name display formats for different UI contexts — single source of truth for player labels.
 */

export type NameFormat =
  | 'full'
  | 'first'
  | 'surname_short'
  | 'initials'
  | 'abbreviated'

/**
 * Format a player name for display
 */
export function formatPlayerName(name: string | null | undefined, format: NameFormat): string {
  const trimmed = name?.trim()
  if (!trimmed) return ''

  const parts = trimmed.split(/\s+/).filter(Boolean)
  const firstName = parts[0] || ''
  const lastName = parts.length > 1 ? parts[parts.length - 1] : ''
  const hasLastName = parts.length > 1

  switch (format) {
    case 'full':
      return trimmed

    case 'first':
      return firstName

    case 'surname_short': {
      const source = hasLastName ? lastName : firstName
      return source.slice(0, 3).toUpperCase()
    }

    case 'initials':
      if (hasLastName) {
        return `${firstName[0]}${lastName[0]}`.toUpperCase()
      }
      return firstName.slice(0, 2).toUpperCase()

    case 'abbreviated':
      if (hasLastName) {
        return `${firstName[0]}. ${lastName}`
      }
      return firstName

    default:
      return trimmed
  }
}

/**
 * Format two player names as a team display
 * Returns "Glen & Rob" or "Team 1" if both empty
 */
export function formatTeamDisplay(
  player1: string | null | undefined,
  player2: string | null | undefined,
  teamNumber: 1 | 2,
  format: 'first' | 'full' = 'first'
): string {
  const name1 = formatPlayerName(player1, format)
  const name2 = formatPlayerName(player2, format)

  if (!name1 && !name2) return `Team ${teamNumber}`
  if (!name1) return name2
  if (!name2) return name1

  return `${name1} & ${name2}`
}

/**
 * Format for scoreboard — 3-letter codes
 * Returns "NOB / AND" style for a team, or "TEAM 1" / "TEAM 2" when no names entered
 */
export function formatTeamScoreboard(
  player1: string | null | undefined,
  player2: string | null | undefined,
  teamNumber: 1 | 2
): string {
  const code1 = formatPlayerName(player1, 'surname_short')
  const code2 = formatPlayerName(player2, 'surname_short')

  if (!code1 && !code2) return `TEAM ${teamNumber}`
  if (!code1) return code2
  if (!code2) return code1

  return `${code1} / ${code2}`
}

/**
 * Get initials for avatar display (1–2 characters)
 */
export function getPlayerInitials(name: string | null | undefined): string {
  const initials = formatPlayerName(name, 'initials')
  return initials || '?'
}

/**
 * Surname codes for vertical stacking (non-empty slots only)
 */
export function getTeamSurnameRows(
  player1: string | null | undefined,
  player2: string | null | undefined
): string[] {
  const surname1 = formatPlayerName(player1, 'surname_short')
  const surname2 = formatPlayerName(player2, 'surname_short')

  return [surname1, surname2].filter(Boolean)
}

/**
 * Spectator columns: both empty → single "Team N" row; otherwise two lines with em dash for empty slot.
 */
export function getSpectatorTeamSurnameRows(
  player1: string | null | undefined,
  player2: string | null | undefined,
  teamNumber: 1 | 2
): string[] {
  const has1 = Boolean(player1?.trim())
  const has2 = Boolean(player2?.trim())
  if (!has1 && !has2) {
    return [`Team ${teamNumber}`]
  }
  return [
    has1 ? formatPlayerName(player1, 'surname_short') : '—',
    has2 ? formatPlayerName(player2, 'surname_short') : '—',
  ]
}
