/**
 * Player name formatting utilities
 * Centralized to avoid duplication across components
 */

/**
 * Extract surname and uppercase it
 * "Glen Noble" → "NOBLE"
 * "Robert" → "ROBERT"
 */
export function getSurnameUppercase(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return 'PLAYER'
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1].toUpperCase()
}

/**
 * Get two-letter initials
 * "Glen Noble" → "GN"
 * "Robert" → "RO"
 * Single-character first names duplicate the letter (e.g. "J" → "JJ")
 */
export function getPlayerInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    const w = parts[0]
    if (w.length >= 2) return w.substring(0, 2).toUpperCase()
    return (w.charAt(0) + w.charAt(0)).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

/**
 * Format name as "F. Surname"
 * "Glen Noble" → "G. Noble"
 * "Robert Anderson" → "R. Anderson"
 */
export function formatNameAbbreviated(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return 'Player'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return fullName.trim()
  const firstInitial = parts[0].charAt(0).toUpperCase()
  const surname = parts.slice(1).join(' ')
  return `${firstInitial}. ${surname}`
}

/**
 * Get single initial for avatar display
 * "Glen Noble" → "G"
 */
export function getFirstInitial(name: string | null | undefined): string {
  if (!name?.trim()) return '?'
  return name.trim().charAt(0).toUpperCase()
}

/**
 * First 3 letters of surname (uppercase), for compact scoreboard labels (e.g. "SMI").
 * Used by control panel abbreviated team names — same behavior as legacy `abbreviateSurname` in score-format.
 */
export function abbreviateSurname(name: string | null | undefined): string {
  if (!name?.trim()) return '---'
  const parts = name.trim().split(/\s+/)
  const lastName = parts[parts.length - 1]
  return lastName.substring(0, 3).toUpperCase()
}

/**
 * Team headline for previews and boards: first names joined, or "Team N" when no names.
 */
export function getTeamDisplayName(
  players: (string | null | undefined)[],
  teamNumber: 1 | 2
): string {
  const names = players.filter((name): name is string => Boolean(name?.trim()))
  if (names.length === 0) return `Team ${teamNumber}`
  return names.map((name) => name.trim().split(/\s+/)[0]).join(' & ')
}

/** Spectator stacks: both empty → one headline; else surnames with placeholder for empty slot. */
export function getSpectatorTeamSurnameRows(
  p1: string | null | undefined,
  p2: string | null | undefined,
  teamNumber: 1 | 2
): string[] {
  const has1 = Boolean(p1?.trim())
  const has2 = Boolean(p2?.trim())
  if (!has1 && !has2) {
    return [getTeamDisplayName([p1, p2], teamNumber)]
  }
  return [
    has1 ? getSurnameUppercase(p1) : '—',
    has2 ? getSurnameUppercase(p2) : '—',
  ]
}
