'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import ScoreDisplay from '@/components/ScoreDisplay'

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
  const courtId = params.id as string
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#000',
        color: '#fff',
        fontSize: '3rem',
        textAlign: 'center',
        padding: '2rem'
      }}>
        No active match
      </div>
    )
  }

  return <ScoreDisplay match={match} variant="court" />
}
