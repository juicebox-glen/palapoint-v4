'use client'

import { useRouter, useParams } from 'next/navigation'

import GameDetailDisplay from '@/components/displays/GameDetailDisplay'
import type { GameDetailData } from '@/lib/types/game-detail'

const dummyGameData: GameDetailData = {
  id: '123',
  team_a_player_1: 'Robert Anderson',
  team_a_player_2: 'Glen Noble',
  team_b_player_1: 'Julian Waters',
  team_b_player_2: 'Carl Pettitt',
  winner: 'b',
  final_score: '6-4',
  set_scores: [{ team_a: 6, team_b: 4 }],
  duration_minutes: 32,
  created_at: '2025-03-05T14:00:00Z',
  completed_at: '2025-03-05T14:32:00Z',
  total_points_played: 58,
  team_a_points_won: 26,
  team_b_points_won: 32,
  team_a_service_points_won: 14,
  team_a_service_points_total: 28,
  team_b_service_points_won: 18,
  team_b_service_points_total: 30,
  team_a_breaks: 1,
  team_b_breaks: 2,
  team_a_longest_streak: 3,
  team_b_longest_streak: 4,
  point_history: [
    1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1,
    1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, -1,
    -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1,
  ],
}

export default function GameDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const game = { ...dummyGameData, id }

  return <GameDetailDisplay game={game} onBack={() => router.back()} />
}
