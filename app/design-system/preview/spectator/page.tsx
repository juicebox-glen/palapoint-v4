'use client'

import type { CSSProperties } from 'react'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

import { SpectatorIdle } from '@/components/displays/spectator/SpectatorIdle'
import { SpectatorPregame } from '@/components/displays/spectator/SpectatorPregame'
import { SpectatorLive } from '@/components/displays/spectator/SpectatorLive'
import { SpectatorEndgame } from '@/components/displays/spectator/SpectatorEndgame'
import type { MatchState } from '@/lib/types/match'

import { TvViewportCanvas } from '../../components/TvViewportCanvas'
import { designSystemSquareOneBranding } from '../../lib/squareone-mock-branding'

const brandingStyles: CSSProperties = {
  '--team-a': designSystemSquareOneBranding.primaryColor,
  '--team-b': designSystemSquareOneBranding.secondaryColor,
  '--brand-primary': designSystemSquareOneBranding.primaryColor,
} as CSSProperties

const mockPregameMatch: MatchState = {
  id: 'mock-match-1',
  court_id: 'mock-court-id',
  version: 1,
  game_mode: 'golden_point',
  sets_to_win: 2,
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
  serving_team: 'a',
  team_a_player_1: 'Glen Noble',
  team_a_player_2: 'Rob Anderson',
  team_b_player_1: 'Julian Waters',
  team_b_player_2: 'Carl Pettit',
  team_a_player_1_photo: null,
  team_a_player_2_photo: null,
  team_b_player_1_photo: null,
  team_b_player_2_photo: null,
  winner: null,
  side_swap_enabled: true,
  session_id: null,
}

const mockLiveMatch: MatchState = {
  ...mockPregameMatch,
  status: 'in_progress',
  team_a_points: 2,
  team_b_points: 1,
  team_a_games: 2,
  team_b_games: 4,
  serving_team: 'a',
  set_scores: [{ team_a: 6, team_b: 4 }],
  started_at: new Date().toISOString(),
}

const mockSetPointMatch: MatchState = {
  ...mockLiveMatch,
  team_a_points: 3,
  team_b_points: 0,
  team_a_games: 5,
  team_b_games: 3,
  set_scores: [],
}

const mockMatchPointMatch: MatchState = {
  ...mockLiveMatch,
  team_a_points: 1,
  team_b_points: 3,
  team_a_games: 3,
  team_b_games: 5,
  serving_team: 'b',
  set_scores: [{ team_a: 4, team_b: 6 }],
}

const mockEndgameMatch: MatchState = {
  ...mockPregameMatch,
  status: 'completed',
  team_a_games: 6,
  team_b_games: 4,
  set_scores: [
    { team_a: 6, team_b: 4 },
    { team_a: 4, team_b: 6 },
    { team_a: 6, team_b: 3 },
  ],
  winner: 'a',
  completed_at: new Date().toISOString(),
}

function SpectatorPreviewContent() {
  const searchParams = useSearchParams()
  const state = searchParams.get('state') || 'idle'
  const embed = searchParams.get('embed') === '1'

  let content

  switch (state) {
    case 'idle':
      content = (
        <SpectatorIdle
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
        />
      )
      break
    case 'pregame':
      content = (
        <SpectatorPregame
          match={mockPregameMatch}
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
        />
      )
      break
    case 'live':
      content = (
        <SpectatorLive match={mockLiveMatch} branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} />
      )
      break
    case 'set_point':
      content = (
        <SpectatorLive
          match={mockSetPointMatch}
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
        />
      )
      break
    case 'match_point':
      content = (
        <SpectatorLive
          match={mockMatchPointMatch}
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
        />
      )
      break
    case 'endgame':
      content = (
        <SpectatorEndgame match={mockEndgameMatch} branding={designSystemSquareOneBranding} brandingStyles={brandingStyles} />
      )
      break
    default:
      content = (
        <SpectatorIdle
          branding={designSystemSquareOneBranding}
          brandingStyles={brandingStyles}
        />
      )
  }

  return (
    <TvViewportCanvas embed={embed} style={brandingStyles}>
      {content}
    </TvViewportCanvas>
  )
}

export default function SpectatorPreviewPage() {
  return (
    <Suspense fallback={<div className="ds-preview-fallback">Loading…</div>}>
      <SpectatorPreviewContent />
    </Suspense>
  )
}
