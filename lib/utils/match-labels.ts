import type { GameMode } from '@/lib/types/match'

export function setsBadgeLabel(setsToWin: number | null | undefined): string {
  const n = setsToWin ?? 1
  return n > 1 ? '3 SETS' : '1 SET'
}

export function modeBadgeLabel(mode: GameMode | string): string {
  if (mode === 'golden_point') return 'GOLDEN'
  if (mode === 'silver_point') return 'SILVER'
  return 'TRADITIONAL'
}
