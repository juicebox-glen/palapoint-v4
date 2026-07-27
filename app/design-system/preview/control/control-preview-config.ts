import type { ControlPanelPreviewConfig } from '@/components/displays/ControlPanel'
import type { MatchState } from '@/lib/types/match'

const DEMO_PLAYERS = {
  team_a_player_1: 'Glen Noble',
  team_a_player_2: 'Rob Anderson',
  team_b_player_1: 'Julian Waters',
  team_b_player_2: 'Carl Pettit',
  team_a_player_1_photo: null as string | null,
  team_a_player_2_photo: null as string | null,
  team_b_player_1_photo: null as string | null,
  team_b_player_2_photo: null as string | null,
}

function baseMatch(overrides: Partial<MatchState> = {}): MatchState {
  return {
    id: 'mock-control-match',
    court_id: 'mock-court-id',
    version: 1,
    game_mode: 'golden_point',
    sets_to_win: 1,
    tiebreak_at: 6,
    status: 'setup',
    current_set: 1,
    is_tiebreak: false,
    team_a_points: 0,
    team_b_points: 0,
    team_a_games: 0,
    team_b_games: 0,
    set_scores: [],
    deuce_count: 0,
    serving_team: null,
    winner: null,
    started_at: null,
    completed_at: null,
    side_swap_enabled: true,
    session_id: 'mock-session',
    ...DEMO_PLAYERS,
    ...overrides,
  }
}

const LIVE_MATCH = baseMatch({
  status: 'in_progress',
  game_mode: 'golden_point',
  sets_to_win: 1,
  team_a_points: 2,
  team_b_points: 1,
  team_a_games: 3,
  team_b_games: 2,
  serving_team: 'a',
  set_scores: [{ team_a: 6, team_b: 4 }],
  started_at: new Date().toISOString(),
})

export function getControlPreviewConfig(state: string): ControlPanelPreviewConfig {
  switch (state) {
    case 'loading':
      return { screen: 'loading' }
    case 'setup':
      return {
        screen: 'setup',
        setupPlayers: ['Glen Noble', 'Rob Anderson', 'Julian Waters', 'Carl Pettit'],
      }
    case 'preview':
      return {
        screen: 'preview',
        match: baseMatch({
          status: 'setup',
          session_id: 'mock-session',
        }),
      }
    case 'live':
      return {
        screen: 'live',
        match: LIVE_MATCH,
      }
    case 'end_confirm':
      return {
        screen: 'end_confirm',
        match: LIVE_MATCH,
      }
    case 'endgame':
      return {
        screen: 'endgame',
        match: baseMatch({
          status: 'completed',
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 6,
          team_b_games: 4,
          serving_team: null,
          set_scores: [{ team_a: 6, team_b: 4 }],
          winner: 'a',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }),
      }
    case 'endgame_multi':
      return {
        screen: 'endgame_multi',
        match: baseMatch({
          status: 'completed',
          sets_to_win: 2,
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 2,
          team_b_games: 1,
          serving_team: null,
          set_scores: [
            { team_a: 6, team_b: 4 },
            { team_a: 4, team_b: 6 },
            { team_a: 6, team_b: 3 },
          ],
          winner: 'a',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }),
      }
    case 'endgame_sweep':
      return {
        screen: 'endgame_sweep',
        match: baseMatch({
          status: 'completed',
          sets_to_win: 2,
          team_a_points: 0,
          team_b_points: 0,
          team_a_games: 2,
          team_b_games: 0,
          serving_team: null,
          set_scores: [
            { team_a: 6, team_b: 2 },
            { team_a: 6, team_b: 4 },
          ],
          winner: 'a',
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }),
      }
    case 'endgame_no_winner':
      return {
        screen: 'endgame_no_winner',
        match: baseMatch({
          status: 'abandoned',
          team_a_points: 30,
          team_b_points: 0,
          team_a_games: 0,
          team_b_games: 0,
          serving_team: null,
          set_scores: [],
          winner: null,
          started_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
        }),
      }
    default:
      return {
        screen: 'setup',
        setupPlayers: ['Glen Noble', 'Rob Anderson', 'Julian Waters', 'Carl Pettit'],
      }
  }
}
