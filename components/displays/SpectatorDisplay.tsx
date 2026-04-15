'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import { formatPointDisplay } from '@/lib/utils/score-format'
import GradientWaveDrift from '@/components/backgrounds/GradientWaveDrift'

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

function getEndgameSetScores(m: MatchState) {
  if (m.set_scores && m.set_scores.length > 0) return m.set_scores
  return [{ team_a: m.team_a_games ?? 0, team_b: m.team_b_games ?? 0 }]
}

function getSurname(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return 'PLAYER'
  const parts = fullName.trim().split(/\s+/)
  return parts[parts.length - 1].toUpperCase()
}

function getPregameInitials(name: string | null | undefined): string {
  if (!name?.trim()) return '??'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) {
    const w = parts[0]
    return w.length >= 2 ? w.substring(0, 2).toUpperCase() : (w.charAt(0) + w.charAt(0)).toUpperCase()
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

function pregameSetsLabel(setsToWin: number | null | undefined): string {
  return (setsToWin ?? 1) > 1 ? '3 SETS' : '1 SET'
}

function pregameModeLabel(mode: MatchState['game_mode']): string {
  if (mode === 'golden_point') return 'GOLDEN'
  if (mode === 'silver_point') return 'SILVER'
  return 'TRADITIONAL'
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
    const courtLabel = (branding?.courtName ?? 'Court 1').toUpperCase()
    const pregameBrandingStyle =
      branding != null
        ? ({
            '--team-a': branding.primaryColor,
            '--team-b': branding.secondaryColor,
          } as React.CSSProperties)
        : undefined
    return (
      <div
        className="spectator-container spectator-container--pregame"
        style={pregameBrandingStyle}
      >
        <GradientWaveDrift />
        <div className="spectator-header">
          <div className="spectator-logo">
            <LogoContent branding={branding ?? null} />
          </div>
          <div className="spectator-header-badges">
            <div className="spectator-ready-badge">
              <span className="spectator-ready-dot" aria-hidden />
              <span>READY</span>
            </div>
            <div className="spectator-court-badge">{courtLabel}</div>
          </div>
        </div>

        <div className="spectator-pregame-broadcast">
          <div className="spectator-pregame-side spectator-pregame-side-a">
            <div className="spectator-pregame-side-inner">
              <div className="spectator-pregame-photos">
                <div className="spectator-pregame-photo-wrap spectator-pregame-photo-a">
                  {match.team_a_player_1_photo ? (
                    <img src={match.team_a_player_1_photo} alt="" />
                  ) : (
                    <span className="spectator-pregame-initials">
                      {getPregameInitials(match.team_a_player_1)}
                    </span>
                  )}
                </div>
                <div className="spectator-pregame-photo-wrap spectator-pregame-photo-a">
                  {match.team_a_player_2_photo ? (
                    <img src={match.team_a_player_2_photo} alt="" />
                  ) : (
                    <span className="spectator-pregame-initials">
                      {getPregameInitials(match.team_a_player_2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="spectator-pregame-names spectator-pregame-names-a">
                <span>{getSurname(match.team_a_player_1)}</span>
                <span>{getSurname(match.team_a_player_2)}</span>
                <div className="spectator-pregame-names-divider" aria-hidden />
              </div>
            </div>
          </div>

          <div className="spectator-pregame-vs">VS</div>

          <div className="spectator-pregame-side spectator-pregame-side-b">
            <div className="spectator-pregame-side-inner">
              <div className="spectator-pregame-photos">
                <div className="spectator-pregame-photo-wrap spectator-pregame-photo-b">
                  {match.team_b_player_1_photo ? (
                    <img src={match.team_b_player_1_photo} alt="" />
                  ) : (
                    <span className="spectator-pregame-initials">
                      {getPregameInitials(match.team_b_player_1)}
                    </span>
                  )}
                </div>
                <div className="spectator-pregame-photo-wrap spectator-pregame-photo-b">
                  {match.team_b_player_2_photo ? (
                    <img src={match.team_b_player_2_photo} alt="" />
                  ) : (
                    <span className="spectator-pregame-initials">
                      {getPregameInitials(match.team_b_player_2)}
                    </span>
                  )}
                </div>
              </div>
              <div className="spectator-pregame-names spectator-pregame-names-b">
                <div className="spectator-pregame-names-divider" aria-hidden />
                <span>{getSurname(match.team_b_player_1)}</span>
                <span>{getSurname(match.team_b_player_2)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="spectator-pregame-badges">
          <span className="spectator-pregame-badge">{pregameSetsLabel(match.sets_to_win)}</span>
          <span className="spectator-pregame-badge">{pregameModeLabel(match.game_mode)}</span>
        </div>
      </div>
    )
  }

  const showSpectatorEndgame =
    match.status === 'completed' ||
    match.status === 'abandoned' ||
    (match.winner != null && match.status !== 'in_progress')

  if (showSpectatorEndgame) {
    const endgameSets = getEndgameSetScores(match)
    return (
      <div className="spectator-container spectator-container--endgame spectator-container--split-field">
        <div className="spectator-header">
          <div className="spectator-logo">
            <LogoContent branding={branding ?? null} />
          </div>
          <div className="spectator-header-right">
            <div className="spectator-game-info">
              <span>{getGameModeText(match.game_mode)}</span>
            </div>
            <div className="spectator-final-badge">
              <span className="spectator-final-dot" aria-hidden />
              <span>FINAL</span>
            </div>
          </div>
        </div>

        <div className="spectator-endgame">
          <div
            className={`spectator-endgame-team ${match.winner === 'a' ? 'spectator-endgame-winner' : ''}`}
          >
            <div className="spectator-endgame-players">
              <div className="spectator-endgame-player">
                {match.team_a_player_1_photo ? (
                  <img
                    src={match.team_a_player_1_photo}
                    alt=""
                    className="spectator-endgame-photo"
                  />
                ) : (
                  <div className="spectator-endgame-avatar" aria-hidden>
                    {match.team_a_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-endgame-name">
                  {match.team_a_player_1?.trim() || 'Player 1'}
                </span>
              </div>
              <div className="spectator-endgame-player">
                {match.team_a_player_2_photo ? (
                  <img
                    src={match.team_a_player_2_photo}
                    alt=""
                    className="spectator-endgame-photo"
                  />
                ) : (
                  <div className="spectator-endgame-avatar" aria-hidden>
                    {match.team_a_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-endgame-name">
                  {match.team_a_player_2?.trim() || 'Player 2'}
                </span>
              </div>
            </div>
            {match.winner === 'a' && (
              <div className="spectator-endgame-winner-label">WINNER</div>
            )}
          </div>

          <div className="spectator-endgame-score">
            {endgameSets.map((set, i) => {
              const a =
                set.team_a ??
                (set as { team_a_games?: number }).team_a_games ??
                0
              const b =
                set.team_b ??
                (set as { team_b_games?: number }).team_b_games ??
                0
              return (
                <div key={i} className="spectator-endgame-set">
                  <span
                    className={
                      match.winner === 'a' ? 'spectator-endgame-set-winner' : ''
                    }
                  >
                    {a}
                  </span>
                  <span className="spectator-endgame-set-divider">-</span>
                  <span
                    className={
                      match.winner === 'b' ? 'spectator-endgame-set-winner' : ''
                    }
                  >
                    {b}
                  </span>
                </div>
              )
            })}
          </div>

          <div
            className={`spectator-endgame-team ${match.winner === 'b' ? 'spectator-endgame-winner' : ''}`}
          >
            <div className="spectator-endgame-players">
              <div className="spectator-endgame-player">
                {match.team_b_player_1_photo ? (
                  <img
                    src={match.team_b_player_1_photo}
                    alt=""
                    className="spectator-endgame-photo"
                  />
                ) : (
                  <div className="spectator-endgame-avatar" aria-hidden>
                    {match.team_b_player_1?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-endgame-name">
                  {match.team_b_player_1?.trim() || 'Player 1'}
                </span>
              </div>
              <div className="spectator-endgame-player">
                {match.team_b_player_2_photo ? (
                  <img
                    src={match.team_b_player_2_photo}
                    alt=""
                    className="spectator-endgame-photo"
                  />
                ) : (
                  <div className="spectator-endgame-avatar" aria-hidden>
                    {match.team_b_player_2?.trim()?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                )}
                <span className="spectator-endgame-name">
                  {match.team_b_player_2?.trim() || 'Player 2'}
                </span>
              </div>
            </div>
            {match.winner === 'b' && (
              <div className="spectator-endgame-winner-label">WINNER</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="spectator-container spectator-container--split-field">
      <div className="spectator-header">
        <div className="spectator-logo">
          <LogoContent branding={branding ?? null} />
        </div>
        <div className="spectator-header-right">
          <div className="spectator-game-info">
            <span>{getGameModeText(match.game_mode)}</span>
            {match.is_tiebreak && (
              <>
                <span className="spectator-divider">|</span>
                <span>TIEBREAK</span>
              </>
            )}
          </div>
          <div className="spectator-live-badge">
            <span className="spectator-live-dot" aria-hidden />
            <span>LIVE</span>
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
            {match.serving_team === 'a' && (
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
            {match.serving_team === 'b' && (
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
