'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { QRCodeSVG } from 'qrcode.react'
import { MatchState } from '@/lib/types/match'
import SideSwapOverlay from '@/components/SideSwapOverlay'
import SetWinOverlay from '@/components/SetWinOverlay'
import ServerAnnouncementOverlay from '@/components/ServerAnnouncementOverlay'
import { getPointSituation } from '@/lib/utils/point-situation'

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

// Calculate if sides should be swapped
// Sides swap after every odd-numbered total game (1, 3, 5, 7...) and every 6 points in tiebreak
function calculateSidesSwapped(match: MatchState): boolean {
  // If side swap is disabled, never swap
  if (match.side_swap_enabled === false) return false
  
  // Count total games from set_scores
  const setScores = match.set_scores || []
  let totalGames = 0
  
  // Add completed set games
  for (const set of setScores) {
    totalGames += (set.team_a || 0) + (set.team_b || 0)
  }
  
  // Add current set games
  totalGames += match.team_a_games + match.team_b_games
  
  // In tiebreak, also count tiebreak points
  if (match.is_tiebreak) {
    const tiebreakPoints = match.team_a_points + match.team_b_points
    // Swap every 6 points in tiebreak
    // Each 6 points = 1 additional "swap unit"
    const tiebreakSwaps = Math.floor(tiebreakPoints / 6)
    // Total swaps = games swaps + tiebreak swaps
    // Games swap on odd totals (1,3,5,7) = swap count is Math.ceil(totalGames / 2) for odd, Math.floor for even
    // Simpler: just count total swap events
    const gameSwaps = Math.floor((totalGames + 1) / 2) // 1 swap after game 1, 2 swaps after game 3, etc.
    return (gameSwaps + tiebreakSwaps) % 2 === 1
  }
  
  // Normal games: swap after odd game counts (1, 3, 5, 7...)
  // After 1 game = swapped, after 2 = not swapped, after 3 = swapped, etc.
  // Pattern: swapped when total games is odd
  return totalGames % 2 === 1
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
  const [setWinData, setSetWinData] = useState<{
    winningTeam: 'a' | 'b'
    setNumber: number
    score: { teamA: number; teamB: number }
  } | null>(null)
  const prevTotalGamesRef = useRef(0)
  const prevTiebreakPointsRef = useRef(0)
  const prevSetsRef = useRef<number>(0)
  const announcementShownRef = useRef<string | null>(null)

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
          filter: `court_id=eq.${court.id}`
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setMatch(null)
          } else {
            const newMatch = payload.new as MatchState
            if (newMatch.status === 'completed' || newMatch.status === 'abandoned') {
              setMatch(null)
            } else {
              setMatch(newMatch)
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [court?.id])

  // Server announcement for new matches
  useEffect(() => {
    if (!match) {
      announcementShownRef.current = null
      setShowServerAnnouncement(false)
      return
    }
    
    // Only show for matches we haven't announced yet
    // and only if match just started (no points/games scored)
    const isNewMatch = match.id !== announcementShownRef.current
    const hasNoScore = match.team_a_points === 0 && 
                       match.team_b_points === 0 && 
                       match.team_a_games === 0 && 
                       match.team_b_games === 0 &&
                       (match.set_scores || []).length === 0
    
    if (isNewMatch && hasNoScore) {
      announcementShownRef.current = match.id
      setShowServerAnnouncement(true)
    }
  }, [match])

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

  const handleSetWinComplete = () => {
    setShowSetWin(false)
    setSetWinData(null)
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

  // IDLE STATE - No active match
  if (!match) {
    const setupUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/setup/${id}` 
      : `/setup/${id}`

    return (
      <div className="court-idle">
        <div className="court-idle-name">{court?.name || 'Court'}</div>
        <div className="court-idle-main-text">Hold button to start</div>
        <div className="court-idle-subtitle">Quick Play: 1 set, Golden Point</div>
        <div className="court-idle-qr">
          <QRCodeSVG value={setupUrl} size={150} />
        </div>
        <div className="court-idle-qr-label">Scan for custom game</div>
      </div>
    )
  }

  // Show server announcement for new match
  if (showServerAnnouncement && match) {
    const teamAName = match.team_a_player_1 || match.team_a_player_2
      ? [match.team_a_player_1, match.team_a_player_2].filter(Boolean).join(' / ')
      : undefined
    const teamBName = match.team_b_player_1 || match.team_b_player_2
      ? [match.team_b_player_1, match.team_b_player_2].filter(Boolean).join(' / ')
      : undefined

    const servingTeam = match.serving_team as 'a' | 'b'

    return (
      <div className="screen-wrapper">
        <ServerAnnouncementOverlay
          servingTeam={servingTeam}
          teamAName={teamAName}
          teamBName={teamBName}
          onComplete={handleServerAnnouncementComplete}
        />
      </div>
    )
  }

  // Show set win overlay
  if (showSetWin && setWinData && match) {
    const teamAName = match.team_a_player_1 || match.team_a_player_2
      ? [match.team_a_player_1, match.team_a_player_2].filter(Boolean).join(' / ')
      : undefined
    const teamBName = match.team_b_player_1 || match.team_b_player_2
      ? [match.team_b_player_1, match.team_b_player_2].filter(Boolean).join(' / ')
      : undefined

    return (
      <div className="screen-wrapper">
        <SetWinOverlay
          winningTeam={setWinData.winningTeam}
          setNumber={setWinData.setNumber}
          score={setWinData.score}
          teamAName={teamAName}
          teamBName={teamBName}
          onComplete={handleSetWinComplete}
        />
      </div>
    )
  }

  // Show side swap overlay
  if (showSideSwap && match) {
    return (
      <div className="screen-wrapper">
        <SideSwapOverlay
          servingTeam={match.serving_team as 'a' | 'b'}
          sidesSwapped={calculateSidesSwapped(match)}
          onComplete={handleSideSwapComplete}
        />
      </div>
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
        name: match.team_a_player_1 || match.team_a_player_2 
          ? [match.team_a_player_1, match.team_a_player_2].filter(Boolean).join(' / ')
          : 'TEAM A',
        points: match.team_a_points,
        games: match.team_a_games,
        setsWon: setScores.filter((s) => s.team_a > s.team_b).length,
        team: 'a' as const
      }
    : {
        name: match.team_b_player_1 || match.team_b_player_2 
          ? [match.team_b_player_1, match.team_b_player_2].filter(Boolean).join(' / ')
          : 'TEAM B',
        points: match.team_b_points,
        games: match.team_b_games,
        setsWon: setScores.filter((s) => s.team_b > s.team_a).length,
        team: 'b' as const
      }

  // Get data for right side (always lighter background)
  const rightTeamData = teamOnRight === 'a'
    ? {
        name: match.team_a_player_1 || match.team_a_player_2 
          ? [match.team_a_player_1, match.team_a_player_2].filter(Boolean).join(' / ')
          : 'TEAM A',
        points: match.team_a_points,
        games: match.team_a_games,
        setsWon: setScores.filter((s) => s.team_a > s.team_b).length,
        team: 'a' as const
      }
    : {
        name: match.team_b_player_1 || match.team_b_player_2 
          ? [match.team_b_player_1, match.team_b_player_2].filter(Boolean).join(' / ')
          : 'TEAM B',
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
      <div className="screen-content layout-split-50-horizontal">
        
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
            <div className={leftPoints === 'ADV' ? 'game-score-adv' : 'game-score'}>
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
            <div className={rightPoints === 'ADV' ? 'game-score-adv' : 'game-score'}>
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
