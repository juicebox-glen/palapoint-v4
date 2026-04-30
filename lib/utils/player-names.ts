/**
 * Player name helpers — re-exports `name-format` plus legacy aliases used across the app.
 */

export {
  formatPlayerName,
  formatTeamDisplay,
  formatTeamScoreboard,
  getPlayerInitials,
  getSpectatorTeamSurnameRows,
  getTeamSurnameRows,
  type NameFormat,
} from './name-format'

import { formatPlayerName, formatTeamDisplay } from './name-format'

/**
 * Team headline for previews and boards: first names with "&", or "Team N" when no names.
 */
export function getTeamDisplayName(
  players: (string | null | undefined)[],
  teamNumber: 1 | 2
): string {
  return formatTeamDisplay(players[0], players[1], teamNumber, 'first')
}

/**
 * Full surname (last word), uppercase — legacy headline style (e.g. full last name on court overlays).
 */
export function getSurnameUppercase(fullName: string | null | undefined): string {
  const trimmed = fullName?.trim()
  if (!trimmed) return 'PLAYER'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  return parts[parts.length - 1].toUpperCase()
}

export function formatNameAbbreviated(fullName: string | null | undefined): string {
  const s = formatPlayerName(fullName, 'abbreviated')
  return s || 'Player'
}

export function getFirstInitial(name: string | null | undefined): string {
  const first = formatPlayerName(name, 'first')
  return first ? first.charAt(0).toUpperCase() : '?'
}

/** Three-letter code or "---" when empty (session review / abbreviated team strings). */
export function abbreviateSurname(name: string | null | undefined): string {
  return formatPlayerName(name, 'surname_short') || '---'
}
