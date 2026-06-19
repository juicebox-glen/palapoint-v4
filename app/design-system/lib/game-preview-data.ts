import type { GameDetailData } from '@/lib/types/game-detail'

import { PREVIEW_GAMES } from './session-preview-data'

const SAMPLE_POINT_HISTORY = [
  1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1,
  1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, -1,
  -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1,
]

function durationMinutes(createdAt: string, completedAt: string | null): number {
  if (!completedAt) return 0
  return Math.max(
    1,
    Math.round(
      (new Date(completedAt).getTime() - new Date(createdAt).getTime()) / 1000 / 60
    )
  )
}

function finalScoreLabel(setScores: SessionReviewGameSetScores): string {
  if (setScores.length > 1) {
    let setsA = 0
    let setsB = 0
    for (const set of setScores) {
      const a = set.team_a ?? set.team_a_games ?? 0
      const b = set.team_b ?? set.team_b_games ?? 0
      if (a > b) setsA++
      else if (b > a) setsB++
    }
    return `${setsA}-${setsB}`
  }
  const set = setScores[0]
  const a = set?.team_a ?? set?.team_a_games ?? 0
  const b = set?.team_b ?? set?.team_b_games ?? 0
  return `${a}-${b}`
}

type SessionReviewGameSetScores = Array<{
  team_a?: number
  team_b?: number
  team_a_games?: number
  team_b_games?: number
}>

function buildPreviewGameDetail(
  game: (typeof PREVIEW_GAMES)[number],
  stats: Partial<
    Pick<
      GameDetailData,
      | 'total_points_played'
      | 'team_a_points_won'
      | 'team_b_points_won'
      | 'team_a_service_points_won'
      | 'team_a_service_points_total'
      | 'team_b_service_points_won'
      | 'team_b_service_points_total'
      | 'team_a_breaks'
      | 'team_b_breaks'
      | 'team_a_longest_streak'
      | 'team_b_longest_streak'
      | 'point_history'
    >
  >
): GameDetailData {
  const winner = game.winner === 'b' ? 'b' : 'a'
  const setScores = (game.set_scores || []).map((set) => ({
    team_a: set.team_a ?? set.team_a_games ?? 0,
    team_b: set.team_b ?? set.team_b_games ?? 0,
  }))

  return {
    id: game.id,
    winner,
    final_score: finalScoreLabel(game.set_scores),
    duration_minutes: durationMinutes(game.created_at, game.completed_at),
    team_a_player_1: game.team_a_player_1 ?? '',
    team_a_player_2: game.team_a_player_2 ?? '',
    team_b_player_1: game.team_b_player_1 ?? '',
    team_b_player_2: game.team_b_player_2 ?? '',
    set_scores: setScores,
    created_at: game.created_at,
    completed_at: game.completed_at ?? game.created_at,
    total_points_played: stats.total_points_played ?? 58,
    team_a_points_won: stats.team_a_points_won ?? 26,
    team_b_points_won: stats.team_b_points_won ?? 32,
    team_a_service_points_won: stats.team_a_service_points_won ?? 14,
    team_a_service_points_total: stats.team_a_service_points_total ?? 28,
    team_b_service_points_won: stats.team_b_service_points_won ?? 18,
    team_b_service_points_total: stats.team_b_service_points_total ?? 30,
    team_a_breaks: stats.team_a_breaks ?? 1,
    team_b_breaks: stats.team_b_breaks ?? 2,
    team_a_longest_streak: stats.team_a_longest_streak ?? 3,
    team_b_longest_streak: stats.team_b_longest_streak ?? 4,
    point_history: stats.point_history ?? SAMPLE_POINT_HISTORY,
  }
}

const PREVIEW_GAME_DETAILS: Record<string, GameDetailData> = {
  'preview-game-1': buildPreviewGameDetail(PREVIEW_GAMES[0]!, {
    total_points_played: 54,
    team_a_points_won: 30,
    team_b_points_won: 24,
    team_a_service_points_won: 16,
    team_a_service_points_total: 27,
    team_b_service_points_won: 12,
    team_b_service_points_total: 27,
    team_a_breaks: 2,
    team_b_breaks: 1,
    team_a_longest_streak: 4,
    team_b_longest_streak: 3,
  }),
  'preview-game-2': buildPreviewGameDetail(PREVIEW_GAMES[1]!, {
    total_points_played: 61,
    team_a_points_won: 27,
    team_b_points_won: 34,
    team_a_service_points_won: 13,
    team_a_service_points_total: 30,
    team_b_service_points_won: 19,
    team_b_service_points_total: 31,
    team_a_breaks: 1,
    team_b_breaks: 3,
    team_a_longest_streak: 3,
    team_b_longest_streak: 5,
  }),
  'preview-game-3': buildPreviewGameDetail(PREVIEW_GAMES[2]!, {
    total_points_played: 112,
    team_a_points_won: 58,
    team_b_points_won: 54,
    team_a_service_points_won: 29,
    team_a_service_points_total: 56,
    team_b_service_points_won: 27,
    team_b_service_points_total: 56,
    team_a_breaks: 3,
    team_b_breaks: 2,
    team_a_longest_streak: 5,
    team_b_longest_streak: 4,
  }),
}

export function getGamePreviewData(gameId: string | null | undefined): GameDetailData {
  if (gameId && PREVIEW_GAME_DETAILS[gameId]) {
    return PREVIEW_GAME_DETAILS[gameId]
  }
  return PREVIEW_GAME_DETAILS['preview-game-1']!
}

export const DEFAULT_GAME_PREVIEW_ID = PREVIEW_GAMES[0]!.id
