'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { QRCodeSVG } from 'qrcode.react'
import { MatchState } from '@/lib/types/match'
import SideSwapOverlay from '@/components/SideSwapOverlay'
import SetWinOverlay from '@/components/SetWinOverlay'
import ServerAnnouncementOverlay from '@/components/ServerAnnouncementOverlay'
import MatchWinOverlay from '@/components/MatchWinOverlay'
import { getPointSituation } from '@/lib/utils/point-situation'
import { buildTeamNameAbbreviated } from '@/lib/utils/score-format'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Format points for display (0, 15, 30, 40, ADV)
function formatPoints(points: number, isAdvantage: boolean, isTiebreak: boolean): string {
  if (isTiebreak) {
    return points.toString()
  }
  if (isAdvantage) {
    return 'ADV'
  }
  const pointMap: Record<number, string> = { 0: '0', 1: '15', 2: '30', 3: '40' }
  return pointMap[points] ?? points.toString()
}

// Calculate if sides should be swapped (V3 logic - padel rules)
// Swap after game 1, then after every odd total (3, 5, 7, 9...). In tiebreak: every 6 points.
// sidesSwapped = cumulative result of all swaps (toggles each time overlay completes)
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

  // Normal games: swap after 1, 3, 5, 7... (odd total). After game 1 we're swapped; after game 2
  // we stay swapped (no new swap); after game 3 we swap again (2nd swap = not swapped).
  const gameSwaps = Math.floor((totalGames + 1) / 2)
  return gameSwaps % 2 === 1
}

// Get court by slug or UUID
async function getCourtBySlug(slugOrId: string) {
  // Try slug first
  const { data: courtBySlug, error: slugError } = await supabase
    .from('courts')
    .select('*')
    .eq('slug', slugOrId)
    .single()

  if (courtBySlug) return { court: courtBySlug, error: null }

  // If not found and looks like UUID, try by ID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slugOrId)) {
    const { data: courtById, error: idError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', slugOrId)
      .single()

    return { court: courtById, error: idError }
  }

  return { court: null, error: slugError }
}

export default function CourtDisplay() {
  const params = useParams()
  const id = params.id as string

  const [court, setCourt] = useState<any>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
  const [leftScoreAnimating, setLeftScoreAnimating] = useState(false)

  // Refs for keyboard handler - always current, avoids stale closure
  const awaitingButtonPressRef = useRef(awaitingButtonPress)
  const showServerAnnouncementRef = useRef(showServerAnnouncement)
  awaitingButtonPressRef.current = awaitingButtonPress
  showServerAnnouncementRef.current = showServerAnnouncement
  const [rightScoreAnimating, setRightScoreAnimating] = useState(false)

  // Load court and match data
  useEffect(() => {
    async function loadData() {
      const { court: courtData, error: courtError } = await getCourtBySlug(id)

      if (courtError || !courtData) {
        setError('Court not found')
        setLoading(false)
        return
      }

      setCourt(courtData)

      // Load active match
      const { data: matchData } = await supabase
        .from('live_matches')
        .select('*')
        .eq('court_id', courtData.id)
        .in('status', ['setup', 'in_progress'])
        .single()

      setMatch(matchData)
      setLoading(false)
    }

    loadData()
  }, [id])

  // WebSocket: connect to FLIC ws-bridge (HOLD/SCORE_LEFT/SCORE_RIGHT/UNDO)
  useEffect(() => {
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
            if (key) {
              window.dispatchEvent(new KeyboardEvent('keydown', { key }))
            }
          } catch {}
        }
        ws.onclose = () => {
          retry = setTimeout(connect, 2000)
        }
      } catch (err) {
        retry = setTimeout(connect, 2000)
      }
    }
    connect()
    return () => {
      if (retry) clearTimeout(retry)
      ws?.close()
    }
  }, [])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!court?.id) return

    const channel = supabase
      .channel(`court-display-${court.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${court.id}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setMatch(null)
          } else if (payload.eventType === 'UPDATE') {
            const updatedMatch = payload.new as MatchState

            // Abandoned = go to idle
            if (updatedMatch.status === 'abandoned') {
              setMatch(null)
              setAwaitingButtonPress(false)
              setShowServerAnnouncement(false)
              return
            }

            // If match is COMPLETED, keep it so we can show match win overlay
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
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [court?.id])

  // Subscribe to session changes for this court
  useEffect(() => {
    if (!court?.id) return

    console.log('Setting up session subscription for court:', court.id)

    const channel = supabase
      .channel(`court-session-${court.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `court_id=eq.${court.id}`,
        },
        (payload) => {
          const eventType = payload.eventType ?? (payload as { event?: string }).event
          console.log('Session subscription received:', eventType, payload.new ?? payload.old)

          if (eventType === 'UPDATE' || eventType === 'DELETE') {
            const session =
              eventType === 'DELETE'
                ? (payload.old as { status?: string } | undefined)
                : (payload.new as { status?: string } | undefined)

            if (
              eventType === 'DELETE' ||
              !session ||
              session.status === 'ended' ||
              session.status === 'expired'
            ) {
              console.log('Session ended/expired, clearing all state')
              setMatch(null)
              setAwaitingButtonPress(false)
              setShowServerAnnouncement(false)
              setShowSetWin(false)
              setShowSideSwap(false)
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('Session subscription status:', status)
      })

    return () => {
      console.log('Cleaning up session subscription')
      supabase.removeChannel(channel)
    }
  }, [court?.id])

  // Server announcement for new matches
  // Quick play (FLIC hold): no session_id → skip Ready to Play, go straight to selecting server
  // Phone setup: has session_id → show Ready to Play, wait for court button press
  useEffect(() => {
    if (!match) {
      announcementShownRef.current = null
      setShowServerAnnouncement(false)
      setAwaitingButtonPress(false)
      return
    }

    const isNewMatch = match.id !== announcementShownRef.current
    const hasNoScore =
      match.team_a_points === 0 &&
      match.team_b_points === 0 &&
      match.team_a_games === 0 &&
      match.team_b_games === 0 &&
      (match.set_scores || []).length === 0

    if (isNewMatch && hasNoScore) {
      announcementShownRef.current = match.id
      setShowSetWin(false)
      setShowSideSwap(false)

      const isQuickPlay = !match.session_id
      if (isQuickPlay) {
        setShowServerAnnouncement(true)
      } else {
        setAwaitingButtonPress(true)
      }
    }

    // Transition when score added OR when started_at set (FLIC acknowledge from Ready to Play)
    if (awaitingButtonPress && (!hasNoScore || match.started_at)) {
      setAwaitingButtonPress(false)
      setShowServerAnnouncement(true)
    }
  }, [match, awaitingButtonPress])

  // Side swap detection
  useEffect(() => {
    // Don't show swap if disabled
    if (!match || showSideSwap || match.side_swap_enabled === false) return

    const setScores = match.set_scores || []
    
    // Count total games
    let totalGames = 0
    for (const set of setScores) {
      totalGames += (set.team_a || 0) + (set.team_b || 0)
    }
    totalGames += match.team_a_games + match.team_b_games

    if (match.is_tiebreak) {
      // Tiebreak: swap every 6 points
      const totalTiebreakPoints = match.team_a_points + match.team_b_points
      const isAtSwapCondition = totalTiebreakPoints > 0 && totalTiebreakPoints % 6 === 0
      
      if (isAtSwapCondition && totalTiebreakPoints !== prevTiebreakPointsRef.current) {
        setShowSideSwap(true)
      }
      
      prevTiebreakPointsRef.current = totalTiebreakPoints
    } else {
      // Normal games: swap after odd game counts (1, 3, 5, 7...)
      const isAtSwapCondition = totalGames % 2 === 1
      
      if (isAtSwapCondition && totalGames !== prevTotalGamesRef.current) {
        setShowSideSwap(true)
      }
      
      prevTotalGamesRef.current = totalGames
      prevTiebreakPointsRef.current = 0
    }
  }, [match, showSideSwap])

  const handleScore = useCallback(
    async (team: 'a' | 'b', source: 'button_a' | 'button_b' | 'control_panel' = 'control_panel') => {
      if (!court?.id) return

      try {
        await fetch(`${SUPABASE_URL}/functions/v1/score`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            court_id: court.id,
            team,
            source,
          }),
        })
      } catch (err) {
        console.error('Error scoring point:', err)
      }
    },
    [court?.id]
  )

  // Single unified keyboard handler (FLIC may send as keyboard or HTTP)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()

      // Only handle our keys (r = FLIC hold for Quick Play start/end)
      if (!['q', 'p', ' ', 'a', 'r'].includes(key)) return

      // Ignore key repeat - prevents double-scoring when holding button
      if (e.repeat) return

      // Use refs for current state (avoids stale closure)
      const awaiting = awaitingButtonPressRef.current
      const serverAnnouncement = showServerAnnouncementRef.current
      const showMatchWin = match?.status === 'completed' && match?.winner

      console.log('Key pressed:', key, {
        awaiting,
        serverAnnouncement,
        showMatchWin,
        showSetWin,
        showSideSwap,
        matchStatus: match?.status,
      })

      // HOLD (r): Quick Play - start new match if none, or end match if active
      if (key === 'r') {
        e.preventDefault()
        if (court?.id) {
          fetch(`${SUPABASE_URL}/functions/v1/score`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              court_id: court.id,
              team: 'a',
              source: 'button_a',
              gesture: 'hold',
            }),
          }).catch((err) => console.error('Quick Play hold error:', err))
        }
        return
      }

      // STATE 1: Ready to Play - waiting for button press to start
      if (awaiting) {
        console.log('Starting game from ready state')
        setAwaitingButtonPress(false)
        setShowServerAnnouncement(true)
        return
      }

      // STATE 2: Server announcement playing - ignore all input
      if (serverAnnouncement) {
        console.log('Ignoring - server announcement playing')
        return
      }

      // STATE 3: Match win overlay - ignore
      if (showMatchWin) {
        console.log('Ignoring - match win showing')
        return
      }

      // STATE 4: Set win overlay - ignore
      if (showSetWin) {
        console.log('Ignoring - set win showing')
        return
      }

      // STATE 5: Side swap overlay - ignore
      if (showSideSwap) {
        console.log('Ignoring - side swap showing')
        return
      }

      // STATE 6: No match or match not in progress - ignore
      if (!match || (match.status !== 'in_progress' && match.status !== 'setup')) {
        console.log('Ignoring - no active match')
        return
      }

      // STATE 7: Active game - SCORE! (positional: left key = left side, right key = right side)
      if (key === 'q' || key === 'a') {
        e.preventDefault()
        handleScore('a', 'button_a')
      } else if (key === 'p') {
        e.preventDefault()
        handleScore('b', 'button_b')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [match, showSetWin, showSideSwap, handleScore, court?.id])

  const handleSideSwapComplete = () => {
    setShowSideSwap(false)
  }

  const handleServerAnnouncementComplete = () => {
    setShowServerAnnouncement(false)
  }

  // Set win detection
  useEffect(() => {
    if (!match || showSetWin) return
    
    const setScores = match.set_scores || []
    const totalSetsCompleted = setScores.length
    
    // Check if a new set was completed
    if (totalSetsCompleted > prevSetsRef.current && totalSetsCompleted > 0) {
      // Get the most recently completed set
      const lastSet = setScores[totalSetsCompleted - 1]
      const winningTeam = lastSet.team_a > lastSet.team_b ? 'a' : 'b'
      
      // Only show if match is not finished (if match finished, show match win instead)
      if (match.status !== 'completed' && match.status !== 'abandoned') {
        setSetWinData({
          winningTeam,
          setNumber: totalSetsCompleted,
          score: {
            teamA: lastSet.team_a,
            teamB: lastSet.team_b
          }
        })
        setShowSetWin(true)
      }
    }
    
    prevSetsRef.current = totalSetsCompleted
  }, [match, showSetWin])

  // Score flash animation when points change (V3 game-score-animate)
  useEffect(() => {
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
  }, [match?.team_a_points, match?.team_b_points, match, showSetWin, showSideSwap, showServerAnnouncement])

  const handleSetWinComplete = () => {
    setShowSetWin(false)
    setSetWinData(null)
  }

  const handleMatchWinComplete = () => {
    setMatch(null)
  }

  if (loading) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="court-idle">
        <div className="court-idle-main-text">{error}</div>
      </div>
    )
  }

  // Match completed - show MatchWin overlay FIRST (before idle check)
  if (match && match.status === 'completed' && match.winner) {
    return (
      <MatchWinOverlay
        match={match}
        onComplete={handleMatchWinComplete}
      />
    )
  }

  // No match - show idle/QR screen (Square One design)
  if (!match) {
    const setupUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/setup/${id}` 
      : `/setup/${id}`

    return (
      <div className="court-idle court-idle-square-one">
        <div className="court-idle-border" />
        <div className="court-idle-content">
          <div className="court-idle-logo">
            <img
              src="/images/squareone-logo.png"
              alt="Square One"
              className="court-idle-logo-img"
            />
          </div>
          <div className="court-idle-instruction">HOLD BUTTON TO START</div>
        </div>
        <div className="court-idle-qr">
          <QRCodeSVG value={setupUrl} size={120} />
        </div>
      </div>
    )
  }

  // Ready to Play screen - waiting for button press to start
  if (awaitingButtonPress && match) {
    const abbreviate = (name: string | null | undefined): string => {
      if (!name) return '---'
      const parts = name.trim().split(' ')
      const lastName = parts[parts.length - 1]
      return lastName.substring(0, 3).toUpperCase()
    }

    return (
      <div className="court-ready-screen">
        {/* Team A - Left Half */}
        <div className="court-ready-half court-ready-team-a">
          <div className="court-ready-names">
            <span className="court-ready-name">{abbreviate(match.team_a_player_1)}</span>
            <span className="court-ready-name">{abbreviate(match.team_a_player_2)}</span>
          </div>
        </div>

        {/* VS Divider */}
        <div className="court-ready-vs">VS</div>

        {/* Team B - Right Half */}
        <div className="court-ready-half court-ready-team-b">
          <div className="court-ready-names">
            <span className="court-ready-name">{abbreviate(match.team_b_player_1)}</span>
            <span className="court-ready-name">{abbreviate(match.team_b_player_2)}</span>
          </div>
        </div>

        {/* Instruction overlay at bottom */}
        <div className="court-ready-instruction">
          PRESS BUTTON TO START
        </div>
      </div>
    )
  }

  // Show server announcement for new match (selecting server)
  if (showServerAnnouncement && match) {
    const teamAName = match.team_a_player_1 || match.team_a_player_2
      ? buildTeamNameAbbreviated(match.team_a_player_1, match.team_a_player_2, 'Team A')
      : undefined
    const teamBName = match.team_b_player_1 || match.team_b_player_2
      ? buildTeamNameAbbreviated(match.team_b_player_1, match.team_b_player_2, 'Team B')
      : undefined

    const servingTeam = match.serving_team as 'a' | 'b'

    return (
      <ServerAnnouncementOverlay
        servingTeam={servingTeam}
        teamAName={teamAName}
        teamBName={teamBName}
        onComplete={handleServerAnnouncementComplete}
      />
    )
  }

  // Show set win overlay
  if (showSetWin && setWinData && match) {
    const teamAName = match.team_a_player_1 || match.team_a_player_2
      ? buildTeamNameAbbreviated(match.team_a_player_1, match.team_a_player_2, 'Team A')
      : undefined
    const teamBName = match.team_b_player_1 || match.team_b_player_2
      ? buildTeamNameAbbreviated(match.team_b_player_1, match.team_b_player_2, 'Team B')
      : undefined

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

  // Show side swap overlay - pass "before swap" positions so circles match scoreboard
  // (Overlay appears at swap moment; teams haven't moved yet)
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

  // MATCH IN PROGRESS
  const isTiebreak = match.is_tiebreak || false
  
  // Calculate if sides should be swapped
  const sidesSwapped = calculateSidesSwapped(match)
  
  // Determine which team is on which side
  const teamOnLeft = sidesSwapped ? 'b' : 'a'
  const teamOnRight = sidesSwapped ? 'a' : 'b'
  
  // Get set scores for calculations
  const setScores = match.set_scores || []
  
  // Get data for left side (always darker background)
  const leftTeamData = teamOnLeft === 'a' 
    ? {
        name: buildTeamNameAbbreviated(match.team_a_player_1, match.team_a_player_2, 'TEAM A'),
        points: match.team_a_points,
        games: match.team_a_games,
        setsWon: setScores.filter((s) => s.team_a > s.team_b).length,
        team: 'a' as const
      }
    : {
        name: buildTeamNameAbbreviated(match.team_b_player_1, match.team_b_player_2, 'TEAM B'),
        points: match.team_b_points,
        games: match.team_b_games,
        setsWon: setScores.filter((s) => s.team_b > s.team_a).length,
        team: 'b' as const
      }

  // Get data for right side (always lighter background)
  const rightTeamData = teamOnRight === 'a'
    ? {
        name: buildTeamNameAbbreviated(match.team_a_player_1, match.team_a_player_2, 'TEAM A'),
        points: match.team_a_points,
        games: match.team_a_games,
        setsWon: setScores.filter((s) => s.team_a > s.team_b).length,
        team: 'a' as const
      }
    : {
        name: buildTeamNameAbbreviated(match.team_b_player_1, match.team_b_player_2, 'TEAM B'),
        points: match.team_b_points,
        games: match.team_b_games,
        setsWon: setScores.filter((s) => s.team_b > s.team_a).length,
        team: 'b' as const
      }

  // Format points for each side
  // Check for advantage (only in non-tiebreak, when both have 3+ points)
  const leftHasAdvantage = !isTiebreak && 
    leftTeamData.points >= 3 && 
    rightTeamData.points >= 3 && 
    leftTeamData.points > rightTeamData.points

  const rightHasAdvantage = !isTiebreak && 
    leftTeamData.points >= 3 && 
    rightTeamData.points >= 3 && 
    rightTeamData.points > leftTeamData.points

  const leftPoints = formatPoints(leftTeamData.points, leftHasAdvantage, isTiebreak)
  const rightPoints = formatPoints(rightTeamData.points, rightHasAdvantage, isTiebreak)

  // Serving border follows the serving team (not fixed to side)
  const servingTeam = match.serving_team // 'a' or 'b'

  // Determine which side the serving team is on
  const servingBorderSide = 
    (servingTeam === 'a' && !sidesSwapped) || (servingTeam === 'b' && sidesSwapped)
      ? 'left'
      : 'right'

  const servingBorderColor = servingTeam === 'a' 
    ? 'var(--color-team-a)' 
    : 'var(--color-team-b)'

  // Number of set dots to show
  const setsToWin = match.sets_to_win || 1
  const setDotsCount = setsToWin === 1 ? 1 : 2

  // Get point situation
  const pointSituation = getPointSituation(match)

  return (
    <div className="screen-wrapper">
      <div className="screen-content game-scoreboard-screen layout-split-50-horizontal">
        
        {/* Tiebreak indicator */}
        {isTiebreak && (
          <div className="tiebreak-indicator">TIE-BREAK</div>
        )}

        {/* Serving border */}
        <div
          className={`screen-border-serving-${servingBorderSide}`}
          style={{ borderColor: servingBorderColor }}
        />

        {/* Left Side - Always darker background, team position based on sidesSwapped */}
        <div className="tile team-1-dark game-team-side">
          <div className="game-team-name">{leftTeamData.name}</div>
          
          <div className="game-score-display">
            <div className={`${leftPoints === 'ADV' ? 'game-score-adv' : 'game-score'} ${leftScoreAnimating ? 'game-score-animate' : ''}`}>
              {leftPoints}
            </div>
          </div>

          <div className="game-set-indicators">
            {Array.from({ length: setDotsCount }).map((_, i) => (
              <div
                key={i}
                className={`game-set-dot ${
                  leftTeamData.setsWon > i 
                    ? (leftTeamData.team === 'a' ? 'game-set-dot-won-team-a' : 'game-set-dot-won-team-b')
                    : 'game-set-dot-not-won'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Right Side - Always lighter background, team position based on sidesSwapped */}
        <div className="tile team-2-dark game-team-side">
          <div className="game-team-name">{rightTeamData.name}</div>
          
          <div className="game-score-display">
            <div className={`${rightPoints === 'ADV' ? 'game-score-adv' : 'game-score'} ${rightScoreAnimating ? 'game-score-animate' : ''}`}>
              {rightPoints}
            </div>
          </div>

          <div className="game-set-indicators">
            {Array.from({ length: setDotsCount }).map((_, i) => (
              <div
                key={i}
                className={`game-set-dot ${
                  rightTeamData.setsWon > i 
                    ? (rightTeamData.team === 'a' ? 'game-set-dot-won-team-a' : 'game-set-dot-won-team-b')
                    : 'game-set-dot-not-won'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Games score (centered at bottom) */}
        <div className="game-games-center">
          <div>{leftTeamData.games} - {rightTeamData.games}</div>
        </div>

        {/* Point situation badge */}
        {pointSituation && (
          <div className="point-situation-overlay">
            <div className={`point-situation-badge ${pointSituation.team === 'a' ? 'team-a' : 'team-b'}`}>
              {pointSituation.type}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
