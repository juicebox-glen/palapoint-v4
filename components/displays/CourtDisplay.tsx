'use client'

import { useEffect, useLayoutEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { QRCodeSVG } from 'qrcode.react'
import type { MatchState } from '@/lib/types/match'
import type { VenueBranding } from '@/lib/venue'
import SideSwapOverlay from '@/components/SideSwapOverlay'
import SetWinOverlay from '@/components/SetWinOverlay'
import ServerAnnouncementOverlay from '@/components/ServerAnnouncementOverlay'
import MatchWinOverlay from '@/components/MatchWinOverlay'
import { getPointSituation, type PointSituation } from '@/lib/utils/point-situation'
import { formatTeamDisplay, formatTeamScoreboard } from '@/lib/utils/name-format'
import { SpectatorPregameTeamInner } from '@/components/displays/spectator/SpectatorPregameTeamInner'
import { ScoreSepBar } from '@/components/ui/ScoreSepBar'
import { VenueLogo } from '@/components/shared/VenueLogo'

import { supabaseFunctionHeaders, SUPABASE_URL } from '@/lib/api/supabase-functions'

function matchHasConfiguredPlayers(match: MatchState): boolean {
  return [
    match.team_a_player_1,
    match.team_a_player_2,
    match.team_b_player_1,
    match.team_b_player_2,
  ].some((name) => typeof name === 'string' && name.trim() !== '')
}

/** Idle hold quick play: no session, no names — skip ready screen, go to server select. */
function isQuickPlaySetupMatch(match: MatchState): boolean {
  return match.status === 'setup' && !match.session_id && !matchHasConfiguredPlayers(match)
}

/** Design-system / static preview: disables network and forces a specific screen. */
export type CourtDisplayPreviewUI =
  | 'idle'
  | 'ready'
  | 'server_announcement'
  | 'scoreboard'
  | 'side_swap'
  | 'set_win'
  | 'match_complete'

export interface CourtDisplayPreviewConfig {
  match: MatchState | null
  ui: CourtDisplayPreviewUI
  setWin?: {
    winningTeam: 'a' | 'b'
    setNumber: number
    score: { teamA: number; teamB: number }
  }
}

interface CourtDisplayProps {
  courtId: string
  setupSlug: string
  branding?: VenueBranding | null
  /** When set, skips Supabase/realtime and uses injected match + UI mode (e.g. design system previews). */
  preview?: CourtDisplayPreviewConfig
}

function formatPoints(points: number, isAdvantage: boolean, isTiebreak: boolean): string {
  if (isTiebreak) return points.toString()
  if (isAdvantage) return 'ADV'
  const pointMap: Record<number, string> = { 0: '0', 1: '15', 2: '30', 3: '40' }
  return pointMap[points] ?? '40'
}

function calculateSidesSwapped(match: MatchState): boolean {
  if (match.side_swap_enabled === false) return false
  const setScores = match.set_scores || []
  let totalGames = 0
  for (const set of setScores) {
    totalGames += (set.team_a || 0) + (set.team_b || 0)
  }
  totalGames += match.team_a_games + match.team_b_games
  if (match.is_tiebreak) {
    const tiebreakPoints = match.team_a_points + match.team_b_points
    const tiebreakSwaps = Math.floor(tiebreakPoints / 6)
    const gameSwaps = Math.floor((totalGames + 1) / 2)
    return (gameSwaps + tiebreakSwaps) % 2 === 1
  }
  const gameSwaps = Math.floor((totalGames + 1) / 2)
  return gameSwaps % 2 === 1
}

function IdleLogo({ branding }: { branding?: VenueBranding | null }) {
  return <VenueLogo branding={branding ?? null} className="court-idle-logo-img" />
}

/** Center badge between point scores — set/match point wins over tie-break label. */
function renderCenterScoreBadge(
  pointSituation: PointSituation | null,
  isTiebreak: boolean
): React.ReactNode | null {
  if (pointSituation?.type === 'MATCH POINT') {
    return (
      <>
        <span className="point-situation-line">MATCH</span>
        <span className="point-situation-line">POINT</span>
      </>
    )
  }
  if (pointSituation?.type === 'SET POINT') {
    return (
      <>
        <span className="point-situation-line">SET</span>
        <span className="point-situation-line">POINT</span>
      </>
    )
  }
  if (isTiebreak) {
    return (
      <>
        <span className="point-situation-line">TIE</span>
        <span className="point-situation-line">BREAK</span>
      </>
    )
  }
  return null
}

export default function CourtDisplay({
  courtId,
  setupSlug,
  branding,
  preview,
}: CourtDisplayProps) {
  const isPreview = Boolean(preview)
  const [match, setMatch] = useState<MatchState | null>(() =>
    preview?.ui === 'idle' ? null : preview?.match ?? null
  )
  const [loading, setLoading] = useState(() => !isPreview)
  const [showSideSwap, setShowSideSwap] = useState(false)
  const [showSetWin, setShowSetWin] = useState(false)
  const [showServerAnnouncement, setShowServerAnnouncement] = useState(false)
  const [awaitingButtonPress, setAwaitingButtonPress] = useState(false)
  const [setWinData, setSetWinData] = useState<{
    winningTeam: 'a' | 'b'
    setNumber: number
    score: { teamA: number; teamB: number }
  } | null>(null)
  const prevTotalGamesRef = useRef(0)
  const prevTiebreakPointsRef = useRef(0)
  const prevSetsRef = useRef<number>(0)
  const prevTeamAPointsRef = useRef(-1)
  const prevTeamBPointsRef = useRef(-1)
  const announcementShownRef = useRef<string | null>(null)
  const serverOverlayDismissedRef = useRef(false)
  const [leftScoreAnimating, setLeftScoreAnimating] = useState(false)
  const [rightScoreAnimating, setRightScoreAnimating] = useState(false)
  const awaitingButtonPressRef = useRef(awaitingButtonPress)
  const showServerAnnouncementRef = useRef(showServerAnnouncement)
  awaitingButtonPressRef.current = awaitingButtonPress
  showServerAnnouncementRef.current = showServerAnnouncement

  useLayoutEffect(() => {
    if (!preview) return
    const { match: m, ui, setWin } = preview
    setMatch(m)
    setAwaitingButtonPress(false)
    setShowServerAnnouncement(false)
    setShowSideSwap(false)
    setShowSetWin(false)
    setSetWinData(null)

    if (ui === 'idle' || !m) {
      return
    }
    switch (ui) {
      case 'ready':
        setAwaitingButtonPress(true)
        break
      case 'server_announcement':
        setShowServerAnnouncement(true)
        break
      case 'side_swap':
        setShowSideSwap(true)
        break
      case 'set_win':
        setSetWinData(
          setWin ?? {
            winningTeam: 'a',
            setNumber: 1,
            score: { teamA: 6, teamB: 4 },
          }
        )
        setShowSetWin(true)
        break
      default:
        break
    }
  }, [preview])

  useEffect(() => {
    if (isPreview) {
      setLoading(false)
      return
    }
    if (!courtId) return
    async function loadMatch() {
      const { data } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtId)
        .in('status', ['setup', 'in_progress'])
        .maybeSingle()
      setMatch(data as MatchState | null)
      setLoading(false)
    }
    loadMatch()
  }, [courtId, isPreview])

  useEffect(() => {
    if (isPreview) return
    if (typeof window === 'undefined') return
    const wsPort = process.env.NEXT_PUBLIC_WS_PORT || '4001'
    const wsUrl = `ws://${window.location.hostname}:${wsPort}`
    let ws: WebSocket | null = null
    let retry: ReturnType<typeof setTimeout> | null = null
    const connect = () => {
      try {
        ws = new WebSocket(wsUrl)
        ws.onmessage = (e) => {
          try {
            const msg = JSON.parse(e.data)
            if (msg?.type !== 'command') return
            const keyMap: Record<string, string> = {
              HOLD: 'r',
              SCORE_LEFT: 'q',
              SCORE_RIGHT: 'p',
              UNDO: 'a',
            }
            const key = keyMap[msg.cmd]
            if (key) window.dispatchEvent(new KeyboardEvent('keydown', { key }))
          } catch {}
        }
        ws.onclose = () => { retry = setTimeout(connect, 2000) }
      } catch (err) {
        retry = setTimeout(connect, 2000)
      }
    }
    connect()
    return () => {
      if (retry) clearTimeout(retry)
      ws?.close()
    }
  }, [isPreview])

  useEffect(() => {
    if (isPreview) return
    if (!courtId) return
    const ch = supabase.channel(`court-display-${courtId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase RealtimeChannel overload
    ;(ch as any).on(
      'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${courtId}`,
        },
        (payload: { eventType: string; new?: MatchState }) => {
          if (payload.eventType === 'DELETE') {
            setMatch(null)
          } else if (payload.eventType === 'UPDATE') {
            const updatedMatch = payload.new as MatchState
            if (updatedMatch.status === 'abandoned') {
              setMatch(null)
              setAwaitingButtonPress(false)
              setShowServerAnnouncement(false)
              return
            }
            setMatch(updatedMatch)
          } else if (payload.eventType === 'INSERT') {
            const newMatch = payload.new as MatchState
            setMatch(newMatch)
            setAwaitingButtonPress(false)
            setShowSetWin(false)
            setShowSideSwap(false)
            setShowServerAnnouncement(false)
            setSetWinData(null)
          }
        }
    )
    ch.subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [courtId, isPreview])

  useEffect(() => {
    if (isPreview) return
    if (!courtId) return
    const ch = supabase.channel(`court-session-${courtId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase RealtimeChannel overload
    ;(ch as any).on(
      'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `court_id=eq.${courtId}`,
        },
        (payload: { eventType?: string; event?: string; new?: { status?: string }; old?: { status?: string } }) => {
          const eventType = payload.eventType ?? payload.event
          if (eventType === 'UPDATE' || eventType === 'DELETE') {
            const session = eventType === 'DELETE' ? payload.old : payload.new
            if (
              eventType === 'DELETE' ||
              !session ||
              session.status === 'ended' ||
              session.status === 'expired'
            ) {
              setMatch(null)
              setAwaitingButtonPress(false)
              setShowServerAnnouncement(false)
              setShowSetWin(false)
              setShowSideSwap(false)
            }
          }
        }
    )
    ch.subscribe()
    return () => {
      supabase.removeChannel(ch)
    }
  }, [courtId, isPreview])

  useEffect(() => {
    if (isPreview) return
    if (!match) {
      announcementShownRef.current = null
      setShowServerAnnouncement(false)
      setAwaitingButtonPress(false)
      return
    }
    const hasNoScore =
      match.team_a_points === 0 &&
      match.team_b_points === 0 &&
      match.team_a_games === 0 &&
      match.team_b_games === 0 &&
      (match.set_scores || []).length === 0

    if (match.status === 'setup') {
      if (isQuickPlaySetupMatch(match)) {
        const isFirstQuickPlayEntry = match.id !== announcementShownRef.current
        if (isFirstQuickPlayEntry) {
          announcementShownRef.current = match.id
          serverOverlayDismissedRef.current = false
          setShowSetWin(false)
          setShowSideSwap(false)
        }
        setAwaitingButtonPress(false)
        setShowServerAnnouncement(!serverOverlayDismissedRef.current)
      } else {
        setShowServerAnnouncement(false)
        setAwaitingButtonPress(true)
      }
      return
    }

    const isNewMatch = match.id !== announcementShownRef.current
    if (isNewMatch && hasNoScore) {
      announcementShownRef.current = match.id
      serverOverlayDismissedRef.current = false
      setShowSetWin(false)
      setShowSideSwap(false)
      const isQuickPlay = !match.session_id
      if (isQuickPlay) {
        setShowServerAnnouncement(true)
      } else {
        setAwaitingButtonPress(true)
      }
    }
    if (awaitingButtonPress && (!hasNoScore || match.started_at)) {
      setAwaitingButtonPress(false)
      if (!serverOverlayDismissedRef.current) {
        setShowServerAnnouncement(true)
      }
    }
  }, [match, awaitingButtonPress, isPreview])

  useEffect(() => {
    if (isPreview) return
    if (!match || showSideSwap || match.side_swap_enabled === false) return
    const setScores = match.set_scores || []
    let totalGames = 0
    for (const set of setScores) {
      totalGames += (set.team_a || 0) + (set.team_b || 0)
    }
    totalGames += match.team_a_games + match.team_b_games

    if (match.is_tiebreak) {
      const totalTiebreakPoints = match.team_a_points + match.team_b_points
      const isAtSwapCondition = totalTiebreakPoints > 0 && totalTiebreakPoints % 6 === 0
      if (isAtSwapCondition && totalTiebreakPoints !== prevTiebreakPointsRef.current) {
        setShowSideSwap(true)
      }
      prevTiebreakPointsRef.current = totalTiebreakPoints
    } else {
      const isAtSwapCondition = totalGames % 2 === 1
      if (isAtSwapCondition && totalGames !== prevTotalGamesRef.current) {
        setShowSideSwap(true)
      }
      prevTotalGamesRef.current = totalGames
      prevTiebreakPointsRef.current = 0
    }
  }, [match, showSideSwap, isPreview])

  const sendCourtPress = useCallback(
    async (team: 'a' | 'b', source: 'button_a' | 'button_b' | 'control_panel' = 'control_panel') => {
      if (isPreview) return null
      if (!courtId) return null
      try {
        const res = await fetch(`${SUPABASE_URL}/functions/v1/score`, {
          method: 'POST',
          headers: supabaseFunctionHeaders(),
          body: JSON.stringify({ court_id: courtId, team, source }),
        })
        const data = (await res.json()) as {
          success?: boolean
          new_state?: MatchState
          error?: string
        }
        if (!res.ok || !data.success) {
          console.warn('[CourtDisplay] score request failed:', data.error ?? res.status)
          return null
        }
        if (data.new_state) {
          setMatch(data.new_state)
        }
        return data
      } catch (err) {
        console.error('Error scoring point:', err)
        return null
      }
    },
    [courtId, isPreview]
  )

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPreview) return
      const key = e.key.toLowerCase()
      if (!['q', 'p', ' ', 'a', 'r'].includes(key)) return
      if (e.repeat) return

      const awaiting = awaitingButtonPressRef.current
      const serverAnnouncement = showServerAnnouncementRef.current
      const showMatchWin = match?.status === 'completed' && match?.winner

      if (key === 'r') {
        e.preventDefault()
        if (courtId) {
          fetch(`${SUPABASE_URL}/functions/v1/score`, {
            method: 'POST',
            headers: supabaseFunctionHeaders(),
            body: JSON.stringify({
              court_id: courtId,
              team: 'a',
              source: 'button_a',
              gesture: 'hold',
            }),
          }).catch((err) => console.error('Quick Play hold error:', err))
        }
        return
      }

      if (awaiting) {
        e.preventDefault()
        // Staff setup (no session): wait for Start Match on control panel, not court buttons.
        if (!match?.session_id) return
        setAwaitingButtonPress(false)
        serverOverlayDismissedRef.current = false
        setShowServerAnnouncement(true)
        showServerAnnouncementRef.current = true
        if (key === 'p') {
          void sendCourtPress('b', 'button_b')
        } else {
          void sendCourtPress('a', 'button_a')
        }
        return
      }
      if (serverAnnouncement) {
        e.preventDefault()
        setShowServerAnnouncement(false)
        showServerAnnouncementRef.current = false
        serverOverlayDismissedRef.current = true
      }
      if (showMatchWin) return
      if (showSetWin) return
      if (showSideSwap) return
      if (!match || (match.status !== 'in_progress' && match.status !== 'setup')) return

      if (key === 'q' || key === 'a') {
        e.preventDefault()
        void sendCourtPress('a', 'button_a')
      } else if (key === 'p') {
        e.preventDefault()
        void sendCourtPress('b', 'button_b')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [match, showSetWin, showSideSwap, sendCourtPress, courtId, isPreview])

  const handleSideSwapComplete = () => setShowSideSwap(false)
  const handleServerAnnouncementComplete = () => {
    serverOverlayDismissedRef.current = true
    setShowServerAnnouncement(false)
    showServerAnnouncementRef.current = false
  }

  useEffect(() => {
    if (isPreview) return
    if (!match || showSetWin) return
    const setScores = match.set_scores || []
    const totalSetsCompleted = setScores.length
    if (totalSetsCompleted > prevSetsRef.current && totalSetsCompleted > 0) {
      const lastSet = setScores[totalSetsCompleted - 1]
      const winningTeam = lastSet.team_a > lastSet.team_b ? 'a' : 'b'
      if (match.status !== 'completed' && match.status !== 'abandoned') {
        setSetWinData({
          winningTeam,
          setNumber: totalSetsCompleted,
          score: { teamA: lastSet.team_a, teamB: lastSet.team_b },
        })
        setShowSetWin(true)
      }
    }
    prevSetsRef.current = totalSetsCompleted
  }, [match, showSetWin, isPreview])

  useEffect(() => {
    if (isPreview) return
    if (!match || showSetWin || showSideSwap || showServerAnnouncement) return
    const pa = match.team_a_points
    const pb = match.team_b_points
    const prevPa = prevTeamAPointsRef.current
    const prevPb = prevTeamBPointsRef.current
    if (prevPa >= 0 && prevPb >= 0) {
      if (pa > prevPa) {
        const teamAOnLeft = !calculateSidesSwapped(match)
        if (teamAOnLeft) setLeftScoreAnimating(true)
        else setRightScoreAnimating(true)
        setTimeout(() => {
          setLeftScoreAnimating(false)
          setRightScoreAnimating(false)
        }, 600)
      } else if (pb > prevPb) {
        const teamAOnLeft = !calculateSidesSwapped(match)
        if (teamAOnLeft) setRightScoreAnimating(true)
        else setLeftScoreAnimating(true)
        setTimeout(() => {
          setLeftScoreAnimating(false)
          setRightScoreAnimating(false)
        }, 600)
      }
    }
    prevTeamAPointsRef.current = pa
    prevTeamBPointsRef.current = pb
  }, [
    match?.team_a_points,
    match?.team_b_points,
    match,
    showSetWin,
    showSideSwap,
    showServerAnnouncement,
    isPreview,
  ])

  const handleSetWinComplete = () => {
    setShowSetWin(false)
    setSetWinData(null)
  }
  const handleMatchWinComplete = () => {
    if (!isPreview) setMatch(null)
  }

  if (loading) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">Loading...</div>
      </div>
    )
  }

  if (match && match.status === 'completed' && match.winner) {
    return <MatchWinOverlay match={match} onComplete={handleMatchWinComplete} />
  }

  if (!match) {
    const setupUrl =
      typeof window !== 'undefined'
        ? `${window.location.origin}/setup/${setupSlug}`
        : `/setup/${setupSlug}`

    return (
      <div className="court-idle court-idle-square-one">
        <div className="court-idle-border" />
        <div className="court-idle-content">
          <div className="court-idle-logo">
            <IdleLogo branding={branding ?? null} />
          </div>
        </div>
        <div className="court-idle-instruction">HOLD BUTTON TO START</div>
        <div className="court-idle-qr">
          <QRCodeSVG value={setupUrl} size={120} />
        </div>
      </div>
    )
  }

  if (awaitingButtonPress && match) {
    const showButtonInstruction = Boolean(match.session_id)
    return (
      <div className="court-ready-screen">
        <div className="court-ready-bg" aria-hidden>
          <div className="court-ready-bg-half court-ready-bg-half-a" />
          <div className="court-ready-bg-half court-ready-bg-half-b" />
        </div>
        <div className="court-ready-broadcast spectator-pregame-broadcast">
          <div className="spectator-pregame-side spectator-pregame-side-a">
            <SpectatorPregameTeamInner
              side="a"
              player1={match.team_a_player_1}
              player2={match.team_a_player_2}
              photo1={match.team_a_player_1_photo}
              photo2={match.team_a_player_2_photo}
            />
          </div>
          <div className="spectator-pregame-vs">VS</div>
          <div className="spectator-pregame-side spectator-pregame-side-b">
            <SpectatorPregameTeamInner
              side="b"
              player1={match.team_b_player_1}
              player2={match.team_b_player_2}
              photo1={match.team_b_player_1_photo}
              photo2={match.team_b_player_2_photo}
            />
          </div>
        </div>
        {showButtonInstruction ? (
          <div className="court-ready-instruction">PRESS BUTTON TO START</div>
        ) : null}
      </div>
    )
  }

  if (showServerAnnouncement && match) {
    const teamAName = formatTeamDisplay(match.team_a_player_1, match.team_a_player_2, 1)
    const teamBName = formatTeamDisplay(match.team_b_player_1, match.team_b_player_2, 2)
    return (
      <ServerAnnouncementOverlay
        servingTeam={match.serving_team as 'a' | 'b'}
        teamAName={teamAName}
        teamBName={teamBName}
        onComplete={handleServerAnnouncementComplete}
      />
    )
  }

  if (showSetWin && setWinData && match) {
    const teamAName = formatTeamDisplay(match.team_a_player_1, match.team_a_player_2, 1)
    const teamBName = formatTeamDisplay(match.team_b_player_1, match.team_b_player_2, 2)
    return (
      <SetWinOverlay
        winningTeam={setWinData.winningTeam}
        setNumber={setWinData.setNumber}
        score={setWinData.score}
        teamAName={teamAName}
        teamBName={teamBName}
        onComplete={handleSetWinComplete}
      />
    )
  }

  if (showSideSwap && match) {
    const setScores = match.set_scores || []
    let totalGames = 0
    for (const set of setScores) {
      totalGames += (set.team_a || 0) + (set.team_b || 0)
    }
    totalGames += match.team_a_games + match.team_b_games
    let sidesBeforeSwap: boolean
    if (match.is_tiebreak) {
      const tiebreakPoints = match.team_a_points + match.team_b_points
      const tiebreakSwaps = Math.floor(tiebreakPoints / 6)
      const gameSwaps = Math.floor((totalGames + 1) / 2)
      sidesBeforeSwap = (gameSwaps + tiebreakSwaps - 1) % 2 === 1
    } else {
      const gameSwaps = Math.floor((totalGames + 1) / 2)
      sidesBeforeSwap = (gameSwaps - 1) % 2 === 1
    }
    return (
      <SideSwapOverlay
        servingTeam={match.serving_team as 'a' | 'b'}
        sidesSwapped={sidesBeforeSwap}
        onComplete={handleSideSwapComplete}
      />
    )
  }

  const isTiebreak = match.is_tiebreak || false
  const sidesSwapped = calculateSidesSwapped(match)
  const teamOnLeft = sidesSwapped ? 'b' : 'a'
  const teamOnRight = sidesSwapped ? 'a' : 'b'
  const setScores = match.set_scores || []

  const leftTeamData =
    teamOnLeft === 'a'
      ? {
          name: formatTeamScoreboard(match.team_a_player_1, match.team_a_player_2, 1),
          points: match.team_a_points,
          games: match.team_a_games,
          setsWon: setScores.filter((s) => s.team_a > s.team_b).length,
          team: 'a' as const,
        }
      : {
          name: formatTeamScoreboard(match.team_b_player_1, match.team_b_player_2, 2),
          points: match.team_b_points,
          games: match.team_b_games,
          setsWon: setScores.filter((s) => s.team_b > s.team_a).length,
          team: 'b' as const,
        }

  const rightTeamData =
    teamOnRight === 'a'
      ? {
          name: formatTeamScoreboard(match.team_a_player_1, match.team_a_player_2, 1),
          points: match.team_a_points,
          games: match.team_a_games,
          setsWon: setScores.filter((s) => s.team_a > s.team_b).length,
          team: 'a' as const,
        }
      : {
          name: formatTeamScoreboard(match.team_b_player_1, match.team_b_player_2, 2),
          points: match.team_b_points,
          games: match.team_b_games,
          setsWon: setScores.filter((s) => s.team_b > s.team_a).length,
          team: 'b' as const,
        }

  const leftHasAdvantage =
    !isTiebreak &&
    leftTeamData.points >= 3 &&
    rightTeamData.points >= 3 &&
    leftTeamData.points > rightTeamData.points
  const rightHasAdvantage =
    !isTiebreak &&
    leftTeamData.points >= 3 &&
    rightTeamData.points >= 3 &&
    rightTeamData.points > leftTeamData.points

  const leftPoints = formatPoints(leftTeamData.points, leftHasAdvantage, isTiebreak)
  const rightPoints = formatPoints(rightTeamData.points, rightHasAdvantage, isTiebreak)
  const servingTeam = match.serving_team
  const servingBorderSide =
    (servingTeam === 'a' && !sidesSwapped) || (servingTeam === 'b' && sidesSwapped)
      ? 'left'
      : 'right'
  const servingBorderColor =
    servingTeam === 'a' ? 'var(--team-a)' : 'var(--team-b)'
  const setsToWin = match.sets_to_win || 1
  const setDotsCount = setsToWin === 1 ? 1 : 2
  const pointSituation = getPointSituation(match)
  const centerScoreBadge = renderCenterScoreBadge(pointSituation, isTiebreak)

  return (
    <div className="screen-wrapper">
      <div className="screen-content game-scoreboard-screen layout-split-50-horizontal">
        <div
          className={`screen-border-serving-${servingBorderSide}`}
          style={{ borderColor: servingBorderColor }}
        />
        <div className="tile team-1-dark game-team-side">
          <div className="game-team-name">{leftTeamData.name}</div>
          <div className="game-score-display">
            <div
              className={`${leftPoints === 'ADV' ? 'game-score-adv' : 'game-score'} ${leftScoreAnimating ? 'game-score-animate' : ''}`}
            >
              {leftPoints}
            </div>
          </div>
          <div className="game-set-indicators">
            {Array.from({ length: setDotsCount }).map((_, i) => (
              <div
                key={i}
                className={`game-set-dot ${
                  leftTeamData.setsWon > i
                    ? leftTeamData.team === 'a'
                      ? 'game-set-dot-won-team-a'
                      : 'game-set-dot-won-team-b'
                    : 'game-set-dot-not-won'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="tile team-2-dark game-team-side">
          <div className="game-team-name">{rightTeamData.name}</div>
          <div className="game-score-display">
            <div
              className={`${rightPoints === 'ADV' ? 'game-score-adv' : 'game-score'} ${rightScoreAnimating ? 'game-score-animate' : ''}`}
            >
              {rightPoints}
            </div>
          </div>
          <div className="game-set-indicators">
            {Array.from({ length: setDotsCount }).map((_, i) => (
              <div
                key={i}
                className={`game-set-dot ${
                  rightTeamData.setsWon > i
                    ? rightTeamData.team === 'a'
                      ? 'game-set-dot-won-team-a'
                      : 'game-set-dot-won-team-b'
                    : 'game-set-dot-not-won'
                }`}
              />
            ))}
          </div>
        </div>
        <div className="game-games-center">
          <span>{leftTeamData.games}</span>
          <ScoreSepBar className="game-games-center-sep" />
          <span>{rightTeamData.games}</span>
        </div>
        {centerScoreBadge && (
          <div className="point-situation-overlay">
            <div className="point-situation-badge">{centerScoreBadge}</div>
          </div>
        )}
      </div>
    </div>
  )
}
