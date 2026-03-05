'use client'

import { useRouter, useParams } from 'next/navigation'
import '@/app/styles/game-detail.css'

// Dummy data for demo - matches V3-style stats structure
const dummyGameData: {
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
} = {
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
  // V3-style stats
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
  // Point history: 1 = Team A won, -1 = Team B won (for momentum chart)
  point_history: [
    1, -1, 1, 1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1,
    1, 1, -1, -1, 1, -1, 1, -1, -1, 1, -1, -1, 1, -1, -1, -1, 1, 1, -1, -1,
    -1, 1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, 1, -1, -1, -1, -1, -1,
  ],
}

function getSurnameAbbrev(name: string | null | undefined): string {
  if (!name?.trim()) return ''
  const parts = name.trim().split(' ')
  const lastName = parts[parts.length - 1]
  return lastName.substring(0, 3).toUpperCase()
}

function buildTeamLabel(
  p1: string | null | undefined,
  p2: string | null | undefined,
  fallback: string
): string {
  const abbrevs = [getSurnameAbbrev(p1), getSurnameAbbrev(p2)].filter(Boolean)
  return abbrevs.length > 0 ? abbrevs.join(' / ') : fallback
}

export default function GameDetailPage() {
  const params = useParams()
  const id = params.id as string
  const router = useRouter()
  const game = dummyGameData

  const teamAName = buildTeamLabel(
    game.team_a_player_1,
    game.team_a_player_2,
    'Team A'
  )
  const teamBName = buildTeamLabel(
    game.team_b_player_1,
    game.team_b_player_2,
    'Team B'
  )

  // Cumulative lead for momentum chart: positive = Team A ahead, negative = Team B
  const momentumData = (game.point_history || []).reduce<number[]>(
    (acc, pt) => {
      const prev = acc.length > 0 ? acc[acc.length - 1] : 0
      acc.push(prev + pt)
      return acc
    },
    []
  )

  // Grid momentum: 4 rows, each point = one dot, filled left-to-right top-to-bottom
  const MOMENTUM_ROWS = 4
  const momentumCols = Math.max(1, Math.ceil(momentumData.length / MOMENTUM_ROWS))
  const momentumDots = momentumData.map((v, i) => {
    const col = i % momentumCols
    const row = Math.floor(i / momentumCols)
    return { col, row, v }
  })

  return (
    <div className="page page-padded game-detail-page">
      <div className="game-detail-header">
        <button
          type="button"
          className="game-detail-back"
          onClick={() => router.back()}
          aria-label="Back"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="game-detail-header-title">Match Details</span>
      </div>

      <div className="game-detail-content">
        {/* Match result */}
        <div
          className={`card game-detail-result ${
            game.winner === 'a' ? 'team-a-winner' : 'team-b-winner'
          }`}
        >
          <div className="game-detail-teams">
            <div className="game-detail-team game-detail-team-left">
              <span className="game-detail-team-name">
                {teamAName.split(' / ').map((part, i) => (
                  <span key={i} className="game-detail-team-name-line">
                    {part}
                  </span>
                ))}
              </span>
            </div>
            <div className="game-detail-score">
              <span className="game-detail-score-value">{game.final_score}</span>
            </div>
            <div className="game-detail-team game-detail-team-right">
              <span className="game-detail-team-name">
                {teamBName.split(' / ').map((part, i) => (
                  <span key={i} className="game-detail-team-name-line">
                    {part}
                  </span>
                ))}
              </span>
            </div>
          </div>
          <div className="game-detail-meta">
            <span>{game.duration_minutes} min</span>
            <span className="game-detail-meta-sep">•</span>
            <span>{game.total_points_played} points</span>
          </div>
        </div>

        {/* Momentum chart */}
        <div className="card game-detail-section">
          <h3 className="card-title">Momentum</h3>
          <div className="game-detail-momentum">
            <div className="game-detail-momentum-labels">
              <span>Team A</span>
              <span>Team B</span>
            </div>
            <div className="game-detail-momentum-chart game-detail-momentum-grid">
              <svg
                viewBox={`0 0 ${momentumCols} ${MOMENTUM_ROWS}`}
                preserveAspectRatio="none"
                className="game-detail-momentum-svg"
              >
                {momentumDots.map(({ col, row, v }, i) => (
                  <circle
                    key={i}
                    cx={col + 0.5}
                    cy={row + 0.5}
                    r="0.28"
                    fill={
                      v > 0
                        ? 'var(--team-a)'
                        : v < 0
                          ? 'var(--team-b)'
                          : 'var(--game-detail-momentum-grid-dot, #8B7BB8)'
                    }
                    opacity={v === 0 ? 0.5 : 1}
                  />
                ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Points won */}
        <div className="card game-detail-section">
          <h3 className="card-title">Points Won</h3>
          <div className="game-detail-stats-row">
            <div className="game-detail-stat">
              <span
                className="game-detail-stat-value"
                style={{ color: 'var(--team-a)' }}
              >
                {game.team_a_points_won}
              </span>
              <span className="game-detail-stat-label">{teamAName}</span>
            </div>
            <div className="game-detail-stat">
              <span
                className="game-detail-stat-value"
                style={{ color: 'var(--team-b)' }}
              >
                {game.team_b_points_won}
              </span>
              <span className="game-detail-stat-label">{teamBName}</span>
            </div>
          </div>
        </div>

        {/* Service stats */}
        <div className="card game-detail-section">
          <h3 className="card-title">Service</h3>
          <div className="game-detail-service-grid">
            <div className="game-detail-service-item">
              <span className="game-detail-service-team" style={{ color: 'var(--team-a)' }}>
                {teamAName}
              </span>
              <span className="game-detail-service-stat">
                {game.team_a_service_points_won}/{game.team_a_service_points_total}
              </span>
              <div className="game-detail-service-bar">
                <div
                  className="game-detail-service-bar-fill"
                  style={{
                    width: `${(game.team_a_service_points_won / game.team_a_service_points_total) * 100}%`,
                    background: 'var(--team-a)',
                  }}
                />
              </div>
            </div>
            <div className="game-detail-service-item">
              <span className="game-detail-service-team" style={{ color: 'var(--team-b)' }}>
                {teamBName}
              </span>
              <span className="game-detail-service-stat">
                {game.team_b_service_points_won}/{game.team_b_service_points_total}
              </span>
              <div className="game-detail-service-bar">
                <div
                  className="game-detail-service-bar-fill"
                  style={{
                    width: `${(game.team_b_service_points_won / game.team_b_service_points_total) * 100}%`,
                    background: 'var(--team-b)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Breaks & streaks */}
        <div className="card game-detail-section">
          <h3 className="card-title">Breaks & Streaks</h3>
          <div className="game-detail-stats-grid">
            <div className="game-detail-mini-stat">
              <span className="game-detail-mini-stat-value">{game.team_a_breaks}</span>
              <span className="game-detail-mini-stat-label">Breaks (Team A)</span>
            </div>
            <div className="game-detail-mini-stat">
              <span className="game-detail-mini-stat-value">{game.team_b_breaks}</span>
              <span className="game-detail-mini-stat-label">Breaks (Team B)</span>
            </div>
            <div className="game-detail-mini-stat">
              <span className="game-detail-mini-stat-value">{game.team_a_longest_streak}</span>
              <span className="game-detail-mini-stat-label">Longest streak (A)</span>
            </div>
            <div className="game-detail-mini-stat">
              <span className="game-detail-mini-stat-value">{game.team_b_longest_streak}</span>
              <span className="game-detail-mini-stat-label">Longest streak (B)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
