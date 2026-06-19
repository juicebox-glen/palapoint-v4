export interface GameDetailData {
  id: string
  winner: 'a' | 'b'
  final_score: string
  duration_minutes: number
  total_points_played: number
  team_a_points_won: number
  team_b_points_won: number
  team_a_service_points_won: number
  team_a_service_points_total: number
  team_b_service_points_won: number
  team_b_service_points_total: number
  team_a_breaks: number
  team_b_breaks: number
  team_a_longest_streak: number
  team_b_longest_streak: number
  point_history: number[]
  team_a_player_1: string
  team_a_player_2: string
  team_b_player_1: string
  team_b_player_2: string
  set_scores: Array<{ team_a: number; team_b: number }>
  created_at: string
  completed_at: string
}
