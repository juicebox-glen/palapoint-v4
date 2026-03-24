'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import { formatPointDisplay } from '@/lib/utils/score-format'

interface SpectatorDisplayProps {
  courtId: string
  branding?: VenueBranding | null
}

/** Columns needed for spectator UI (includes player headshot URLs on `live_matches`). */
const SPECTATOR_LIVE_MATCH_SELECT = [
  'id',
  'court_id',
  'version',
  'game_mode',
  'sets_to_win',
  'tiebreak_at',
  'status',
  'current_set',
  'is_tiebreak',
  'team_a_points',
  'team_b_points',
  'team_a_games',
  'team_b_games',
  'set_scores',
  'tiebreak_scores',
  'tiebreak_starting_server',
  'deuce_count',
  'serving_team',
  'team_a_player_1',
  'team_a_player_2',
  'team_b_player_1',
  'team_b_player_2',
  'team_a_player_1_photo',
  'team_a_player_2_photo',
  'team_b_player_1_photo',
  'team_b_player_2_photo',
  'winner',
  'started_at',
  'completed_at',
  'side_swap_enabled',
  'session_id',
  'created_at',
].join(',')

function PlayerRow({
  name,
  photoUrl,
  nameFallback = 'Player',
}: {
  name: string | null | undefined
  photoUrl?: string | null
  nameFallback?: string
}) {
  const display = name?.trim() ? name.trim() : nameFallback
  const initial = name?.trim()
    ? name.trim().charAt(0).toUpperCase()
    : '?'

  return (
    <div className="spectator-player-row">
      {photoUrl ? (
        <img src={photoUrl} alt={display} className="spectator-player-photo" />
      ) : (
        <div className="spectator-player-avatar" aria-hidden>
          {initial}
        </div>
      )}
      <span className="spectator-player-name">{display}</span>
    </div>
  )
}

function getGameModeText(mode: string): string {
  switch (mode) {
    case 'golden_point':
      return 'GOLDEN POINT'
    case 'silver_point':
      return 'SILVER POINT'
    case 'traditional':
      return 'TRADITIONAL'
    default:
      return mode.toUpperCase()
  }
}

function getScoreColumns(m: MatchState) {
  const columns: {
    teamA: string | number
    teamB: string | number
    isPoints?: boolean
    isPastSet?: boolean
    isFinalSet?: boolean
  }[] = []
  const isMatchComplete =
    m.status === 'completed' || m.status === 'abandoned' || m.winner

  if (m.set_scores && Array.isArray(m.set_scores)) {
    m.set_scores.forEach(
      (
        set: {
          team_a?: number
          team_b?: number
          team_a_games?: number
          team_b_games?: number
        },
        idx: number
      ) => {
        const teamAGames = set.team_a_games ?? set.team_a ?? 0
        const teamBGames = set.team_b_games ?? set.team_b ?? 0
        const isLastSet = idx === m.set_scores!.length - 1
        columns.push({
          teamA: teamAGames,
          teamB: teamBGames,
          isPastSet: true,
          isFinalSet: !!isMatchComplete && isLastSet,
        })
      }
    )
  }

  if (isMatchComplete && columns.length === 0) {
    columns.push({
      teamA: m.team_a_games ?? 0,
      teamB: m.team_b_games ?? 0,
      isPastSet: true,
      isFinalSet: true,
    })
  }

  if (!isMatchComplete) {
    columns.push({
      teamA: m.team_a_games ?? 0,
      teamB: m.team_b_games ?? 0,
      isPastSet: false,
    })
    const pointsA = formatPointDisplay(
      m.team_a_points ?? 0,
      m.team_b_points ?? 0,
      m.is_tiebreak ?? false,
      m.is_tiebreak ? m.tiebreak_scores?.team_a : undefined
    )
    const pointsB = formatPointDisplay(
      m.team_b_points ?? 0,
      m.team_a_points ?? 0,
      m.is_tiebreak ?? false,
      m.is_tiebreak ? m.tiebreak_scores?.team_b : undefined
    )
    columns.push({ teamA: pointsA, teamB: pointsB, isPoints: true })
  }

  return columns
}

function LogoContent({ branding }: { branding: VenueBranding | null }) {
  if (!branding) {
    return (
      <img
        src="/images/squareone-logo.png"
        alt="Square One"
        className="spectator-logo-img"
      />
    )
  }
  if (branding.logoUrl) {
    return (
      <img
        src={branding.logoUrl}
        alt={branding.companyName}
        className="spectator-logo-img"
      />
    )
  }
  return (
    <span className="spectator-logo-text" style={{ color: 'inherit' }}>
      {branding.companyName}
    </span>
  )
}

export default function SpectatorDisplay({ courtId, branding }: SpectatorDisplayProps) {
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    async function loadMatch() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_matches')
          .select(SPECTATOR_LIVE_MATCH_SELECT)
          .eq('court_id', courtId)
          .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (fetchError) {
          console.error('Error loading match:', fetchError)
          setError('Failed to load match')
        } else {
          setMatch(data as MatchState | null)
        }
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    const ch = supabase.channel(`live-spectator-${courtId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase RealtimeChannel overload resolution
    ;(ch as any).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `court_id=eq.${courtId}`,
      },
      (payload: { eventType?: string; new?: MatchState }) => {
        if (payload.eventType === 'DELETE') return
        if (payload.new) setMatch(payload.new)
      }
    )
    channel = ch.subscribe()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
  }, [courtId])

  useEffect(() => {
    if (!courtId || match) return
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('live_matches')
        .select(SPECTATOR_LIVE_MATCH_SELECT)
        .eq('court_id', courtId)
        .in('status', ['setup', 'in_progress', 'completed', 'abandoned'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (data) setMatch(data as unknown as MatchState)
    }, 5000)
    return () => clearInterval(interval)
  }, [courtId, match])

  if (loading) {
    return (
      <div className="spectator-container">
        <p className="spectator-loading">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="spectator-container">
        <p className="spectator-error">{error}</p>
      </div>
    )
  }

  if (!match) {
    return (
      <div className="spectator-container">
        <div className="spectator-header">
          <div className="spectator-logo">
            <LogoContent branding={branding ?? null} />
          </div>
          <div className="spectator-header-right">
            <div className="spectator-live-badge">
              <span className="spectator-offline-dot" aria-hidden />
              <span>OFFLINE</span>
            </div>
          </div>
        </div>
        <div className="spectator-no-match">
          <p>No active match</p>
        </div>
      </div>
    )
  }

  if (match.status === 'setup') {
    const setsToWin = match.sets_to_win ?? 1
    return (
      <div className="spectator-container spectator-container--pregame">
        <div className="spectator-header">
          <div className="spectator-logo">
            <LogoContent branding={branding ?? null} />
          </div>
          <div className="spectator-header-right">
            <div className="spectator-pregame-badge">
              <span className="spectator-pregame-dot" aria-hidden />
              <span>COMING UP</span>
            </div>
          </div>
        </div>

        <div className="spectator-pregame">
          <div className="spectator-pregame-team spectator-pregame-team-a">
            <div className="spectator-pregame-players">
              <div className="spectator-pregame-player">
                {match.team_a_player_1_photo ? (
                  <img
                    src={match.team_a_player_1_photo}
                    alt=""
                    className="spectator-pregame-photo"
                  />
                ) : (
                  <div className="spectator-pregame-avatar" aria-hidden>
                    {match.team_a_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-pregame-name">
                  {match.team_a_player_1?.trim() || 'Player 1'}
                </span>
              </div>
              <div className="spectator-pregame-player">
                {match.team_a_player_2_photo ? (
                  <img
                    src={match.team_a_player_2_photo}
                    alt=""
                    className="spectator-pregame-photo"
                  />
                ) : (
                  <div className="spectator-pregame-avatar" aria-hidden>
                    {match.team_a_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-pregame-name">
                  {match.team_a_player_2?.trim() || 'Player 2'}
                </span>
              </div>
            </div>
          </div>

          <div className="spectator-pregame-vs">VS</div>

          <div className="spectator-pregame-team spectator-pregame-team-b">
            <div className="spectator-pregame-players">
              <div className="spectator-pregame-player">
                {match.team_b_player_1_photo ? (
                  <img
                    src={match.team_b_player_1_photo}
                    alt=""
                    className="spectator-pregame-photo"
                  />
                ) : (
                  <div className="spectator-pregame-avatar" aria-hidden>
                    {match.team_b_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-pregame-name">
                  {match.team_b_player_1?.trim() || 'Player 1'}
                </span>
              </div>
              <div className="spectator-pregame-player">
                {match.team_b_player_2_photo ? (
                  <img
                    src={match.team_b_player_2_photo}
                    alt=""
                    className="spectator-pregame-photo"
                  />
                ) : (
                  <div className="spectator-pregame-avatar" aria-hidden>
                    {match.team_b_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-pregame-name">
                  {match.team_b_player_2?.trim() || 'Player 2'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="spectator-pregame-mode">
          {getGameModeText(match.game_mode)}
          {setsToWin > 1 && ` • BEST OF ${setsToWin * 2 - 1}`}
        </div>
      </div>
    )
  }

  const isMatchComplete =
    match.status === 'completed' || match.status === 'abandoned' || match.winner

  return (
    <div className="spectator-container">
      <div className="spectator-header">
        <div className="spectator-logo">
          <LogoContent branding={branding ?? null} />
        </div>
        <div className="spectator-header-right">
          <div className="spectator-game-info">
            <span>{getGameModeText(match.game_mode)}</span>
            {match.is_tiebreak && !isMatchComplete && (
              <>
                <span className="spectator-divider">|</span>
                <span>TIEBREAK</span>
              </>
            )}
          </div>
          <div
            className={`spectator-live-badge ${isMatchComplete ? 'spectator-final-badge' : ''}`}
          >
            <span
              className={isMatchComplete ? 'spectator-final-dot' : 'spectator-live-dot'}
              aria-hidden
            />
            <span>{isMatchComplete ? 'FINAL' : 'LIVE'}</span>
          </div>
        </div>
      </div>

      <div className="spectator-cards">
        <div className="spectator-card spectator-card-team-a">
          <div className="spectator-card-names">
            <PlayerRow
              name={match.team_a_player_1}
              photoUrl={match.team_a_player_1_photo}
              nameFallback="Player 1"
            />
            <PlayerRow
              name={match.team_a_player_2}
              photoUrl={match.team_a_player_2_photo}
              nameFallback="Player 2"
            />
          </div>
          <div className="spectator-card-scores">
            {!isMatchComplete && match.serving_team === 'a' && (
              <span className="spectator-serving-dot" aria-hidden />
            )}
            {getScoreColumns(match).map((col, i) => (
              <span
                key={i}
                className={`spectator-score ${col.isPoints ? 'spectator-score-points' : col.isPastSet ? 'spectator-score-past-set' : 'spectator-score-games'} ${col.isFinalSet && match.winner === 'a' ? 'spectator-score-winner' : ''}`}
              >
                {col.teamA}
              </span>
            ))}
          </div>
        </div>

        <div className="spectator-card spectator-card-team-b">
          <div className="spectator-card-names">
            <PlayerRow
              name={match.team_b_player_1}
              photoUrl={match.team_b_player_1_photo}
              nameFallback="Player 1"
            />
            <PlayerRow
              name={match.team_b_player_2}
              photoUrl={match.team_b_player_2_photo}
              nameFallback="Player 2"
            />
          </div>
          <div className="spectator-card-scores">
            {!isMatchComplete && match.serving_team === 'b' && (
              <span className="spectator-serving-dot" aria-hidden />
            )}
            {getScoreColumns(match).map((col, i) => (
              <span
                key={i}
                className={`spectator-score ${col.isPoints ? 'spectator-score-points' : col.isPastSet ? 'spectator-score-past-set' : 'spectator-score-games'} ${col.isFinalSet && match.winner === 'b' ? 'spectator-score-winner' : ''}`}
              >
                {col.teamB}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
