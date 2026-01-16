'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getCourtBySlug, type Court } from '@/lib/supabase'
import ScoreDisplay from '@/components/ScoreDisplay'
import { QRCodeSVG } from 'qrcode.react'

interface MatchState {
  id: string
  court_id: string
  version: number
  game_mode: string
  sets_to_win: number
  tiebreak_at: number
  status: string
  current_set: number
  is_tiebreak: boolean
  team_a_points: number
  team_b_points: number
  team_a_games: number
  team_b_games: number
  set_scores: Array<{ team_a: number; team_b: number }>
  tiebreak_scores?: { team_a: number; team_b: number }
  tiebreak_starting_server?: string
  deuce_count: number
  serving_team: 'a' | 'b' | null
  team_a_player_1?: string | null
  team_a_player_2?: string | null
  team_b_player_1?: string | null
  team_b_player_2?: string | null
  winner: 'a' | 'b' | null
  started_at?: string | null
  completed_at?: string | null
}

export default function CourtPage() {
  const params = useParams()
  const courtIdentifier = params.id as string
  const [court, setCourt] = useState<Court | null>(null)
  const [courtId, setCourtId] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupUrl, setSetupUrl] = useState<string>('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSetupUrl(`${window.location.origin}/setup/${courtIdentifier}`)
    }
  }, [courtIdentifier])

  useEffect(() => {
    if (!courtIdentifier) return

    // Resolve court ID from slug or UUID
    async function resolveCourt() {
      try {
        const courtData = await getCourtBySlug(courtIdentifier)
        if (!courtData) {
          setError('Court not found')
          setLoading(false)
          return
        }
        setCourt(courtData)
        setCourtId(courtData.id)
      } catch (err) {
        console.error('Error resolving court:', err)
        setError('Failed to load court')
        setLoading(false)
      }
    }

    resolveCourt()
  }, [courtIdentifier])

  useEffect(() => {
    if (!courtId) return

    let channel: ReturnType<typeof supabase.channel> | null = null

    // Initial load
    async function loadMatch() {
      try {
        const { data, error: fetchError } = await supabase
          .from('live_matches')
          .select('*')
          .eq('court_id', courtId)
          .in('status', ['setup', 'in_progress'])
          .maybeSingle()

        if (fetchError) {
          console.error('Error loading match:', fetchError)
          setError('Failed to load match')
          setLoading(false)
          return
        }

        setMatch(data)
        setLoading(false)
      } catch (err) {
        console.error('Unexpected error:', err)
        setError('Unexpected error occurred')
        setLoading(false)
      }
    }

    loadMatch()

    // Subscribe to real-time changes
    channel = supabase
      .channel(`court-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
          console.log('Realtime update:', payload)
          
          if (payload.eventType === 'DELETE') {
            setMatch(null)
            return
          }

          const updatedMatch = payload.new as MatchState
          
          // Only update if match is still active
          if (updatedMatch.status === 'setup' || updatedMatch.status === 'in_progress') {
            setMatch(updatedMatch)
          } else {
            // Match completed or abandoned
            setMatch(null)
          }
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status)
        if (status === 'SUBSCRIBED') {
          console.log('Subscribed to court updates')
        } else if (status === 'CLOSED') {
          console.log('Subscription closed')
        }
      })

    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [courtId])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        fontSize: '2rem'
      }}>
        Loading...
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        color: '#ef4444',
        fontSize: '2rem'
      }}>
        {error}
      </div>
    )
  }

  if (!match) {
    // Idle state - show court info and instructions
    return (
      <div className="court-idle">
        <div className="court-idle-content">
          {court && (
            <h1 className="court-idle-name">{court.name}</h1>
          )}
          
          <div className="court-idle-instructions">
            <div className="court-idle-main-text">Hold button to start</div>
            <div className="court-idle-sub-text">Quick Play: 1 set, Golden Point</div>
          </div>

          {setupUrl && (
            <div className="court-idle-qr">
              <QRCodeSVG
                value={setupUrl}
                size={200}
                level="M"
                includeMargin={true}
                fgColor="#ffffff"
                bgColor="#000000"
              />
              <div className="court-idle-qr-label">Scan for custom game</div>
            </div>
          )}
        </div>

        <style jsx>{`
          .court-idle {
            display: flex;
            align-items: center;
            justify-content: center;
            height: 100vh;
            background: #000;
            color: #fff;
            padding: 2rem;
          }
          .court-idle-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 3rem;
            text-align: center;
            max-width: 600px;
          }
          .court-idle-name {
            font-size: 2.5rem;
            font-weight: 600;
            margin: 0;
            opacity: 0.9;
          }
          .court-idle-instructions {
            display: flex;
            flex-direction: column;
            gap: 1rem;
          }
          .court-idle-main-text {
            font-size: 3rem;
            font-weight: bold;
            line-height: 1.2;
          }
          .court-idle-sub-text {
            font-size: 1.5rem;
            opacity: 0.7;
          }
          .court-idle-qr {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1rem;
            margin-top: 1rem;
          }
          .court-idle-qr-label {
            font-size: 1.2rem;
            opacity: 0.8;
          }
          @media (max-width: 768px) {
            .court-idle-name {
              font-size: 2rem;
            }
            .court-idle-main-text {
              font-size: 2.5rem;
            }
            .court-idle-sub-text {
              font-size: 1.2rem;
            }
          }
        `}</style>
      </div>
    )
  }

  return <ScoreDisplay match={match} variant="court" />
}
