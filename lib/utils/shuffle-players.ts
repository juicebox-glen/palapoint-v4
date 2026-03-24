import type { PlayerPhotosState } from '@/lib/types/match'

const SLOT_KEYS: (keyof PlayerPhotosState)[] = [
  'team_a_player_1_photo',
  'team_a_player_2_photo',
  'team_b_player_1_photo',
  'team_b_player_2_photo',
]

/**
 * Fisher–Yates shuffle while keeping each player name paired with their photo.
 * Slot order stays Team A1, A2, B1, B2; only which person fills each slot changes.
 */
export function shufflePlayersWithPhotos(
  players: string[],
  playerPhotos: PlayerPhotosState
): { players: string[]; playerPhotos: PlayerPhotosState } {
  const entries = players.map((name, i) => ({
    name,
    photo: playerPhotos[SLOT_KEYS[i]] ?? null,
  }))

  for (let i = entries.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[entries[i], entries[j]] = [entries[j], entries[i]]
  }

  return {
    players: entries.map((e) => e.name),
    playerPhotos: {
      team_a_player_1_photo: entries[0].photo,
      team_a_player_2_photo: entries[1].photo,
      team_b_player_1_photo: entries[2].photo,
      team_b_player_2_photo: entries[3].photo,
    },
  }
}
