import type { CourtDisplayPreviewConfig } from '@/components/displays/CourtDisplay'
import type { MatchState } from '@/lib/types/match'
import { brandingStylesFor, type VenueBranding } from '@/lib/venue'

export { brandingStylesFor }

const PLAYERS: Pick<
  MatchState,
  | 'team_a_player_1'
  | 'team_a_player_2'
  | 'team_b_player_1'
  | 'team_b_player_2'
  | 'team_a_player_1_photo'
  | 'team_a_player_2_photo'
  | 'team_b_player_1_photo'
  | 'team_b_player_2_photo'
> = {
  team_a_player_1: 'Glen Noble',
  team_a_player_2: 'Rob Anderson',
  team_b_player_1: 'Julian Waters',
  team_b_player_2: 'Carl Pettit',
  team_a_player_1_photo: null,
  team_a_player_2_photo: null,
  team_b_player_1_photo: null,
  team_b_player_2_photo: null,
}

function baseMatch(overrides: Partial<MatchState> = {}): MatchState {
  return {
    id: 'mock-court-match',
    court_id: 'mock-court-id',
    version: 1,
    game_mode: 'traditional',
    sets_to_win: 2,
    tiebreak_at: 6,
    status: 'in_progress',
    current_set: 1,
    is_tiebreak: false,
    team_a_points: 0,
    team_b_points: 0,
    team_a_games: 0,
    team_b_games: 0,
    set_scores: [],
    deuce_count: 0,
    serving_team: 'a',
    winner: null,
    started_at: new Date().toISOString(),
    completed_at: null,
    side_swap_enabled: true,
    session_id: 'mock-session',
    ...PLAYERS,
    ...overrides,
  }
}

/** Maps design-system ?state= to CourtDisplay preview config */
export function getCourtPreviewConfig(state: string): CourtDisplayPreviewConfig {
  switch (state) {
    case 'idle':
      return { match: null, ui: 'idle' }

    case 'ready':
      return {
        match: baseMatch({
          status: 'setup',
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 0,
          team_b_games: 0,
          serving_team: null,
          started_at: null,
          session_id: 'mock-session',
        }),
        ui: 'ready',
      }

    case 'server_select':
      return {
        match: baseMatch({
          status: 'in_progress',
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 0,
          team_b_games: 0,
          serving_team: 'a',
          started_at: new Date().toISOString(),
          session_id: null,
        }),
        ui: 'server_announcement',
      }

    case 'live':
      return {
        match: baseMatch({
          team_a_points: 2,
          team_b_points: 1,
          team_a_games: 3,
          team_b_games: 2,
          serving_team: 'a',
          set_scores: [{ team_a: 6, team_b: 4 }],
        }),
        ui: 'scoreboard',
      }

    case 'deuce':
      return {
        match: baseMatch({
          team_a_points: 3,
          team_b_points: 3,
          team_a_games: 5,
          team_b_games: 4,
          serving_team: 'b',
        }),
        ui: 'scoreboard',
      }

    case 'advantage':
      return {
        match: baseMatch({
          team_a_points: 4,
          team_b_points: 3,
          team_a_games: 5,
          team_b_games: 4,
          serving_team: 'b',
        }),
        ui: 'scoreboard',
      }

    case 'game_point':
      return {
        match: baseMatch({
          team_a_points: 3,
          team_b_points: 1,
          team_a_games: 4,
          team_b_games: 4,
          serving_team: 'a',
        }),
        ui: 'scoreboard',
      }

    case 'set_point':
      return {
        match: baseMatch({
          sets_to_win: 2,
          team_a_points: 3,
          team_b_points: 0,
          team_a_games: 5,
          team_b_games: 3,
          serving_team: 'a',
          set_scores: [],
        }),
        ui: 'scoreboard',
      }

    case 'match_point':
      return {
        match: baseMatch({
          sets_to_win: 2,
          team_a_points: 3,
          team_b_points: 1,
          team_a_games: 5,
          team_b_games: 2,
          serving_team: 'a',
          set_scores: [{ team_a: 6, team_b: 4 }],
        }),
        ui: 'scoreboard',
      }

    case 'tiebreak':
      return {
        match: baseMatch({
          is_tiebreak: true,
          team_a_points: 6,
          team_b_points: 5,
          team_a_games: 6,
          team_b_games: 6,
          serving_team: 'b',
          tiebreak_scores: { team_a: 6, team_b: 5 },
        }),
        ui: 'scoreboard',
      }

    case 'side_swap':
      return {
        match: baseMatch({
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 2,
          team_b_games: 1,
          serving_team: 'b',
          set_scores: [],
        }),
        ui: 'side_swap',
      }

    case 'game_won':
      return {
        match: baseMatch({
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 4,
          team_b_games: 2,
          serving_team: 'b',
        }),
        ui: 'scoreboard',
      }

    case 'set_won':
      return {
        match: baseMatch({
          sets_to_win: 2,
          current_set: 2,
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 0,
          team_b_games: 0,
          serving_team: 'a',
          set_scores: [{ team_a: 6, team_b: 4 }],
        }),
        ui: 'set_win',
        setWin: {
          winningTeam: 'a',
          setNumber: 1,
          score: { teamA: 6, teamB: 4 },
        },
      }

    case 'match_won':
      return {
        match: baseMatch({
          status: 'completed',
          sets_to_win: 2,
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 6,
          team_b_games: 3,
          serving_team: null,
          set_scores: [
            { team_a: 6, team_b: 4 },
            { team_a: 6, team_b: 3 },
          ],
          winner: 'a',
          completed_at: new Date().toISOString(),
        }),
        ui: 'match_complete',
      }

    default:
      return { match: null, ui: 'idle' }
  }
}
