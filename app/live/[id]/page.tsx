'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase, getCourtBySlug } from '@/lib/supabase'
import ScoreDisplay from '@/components/ScoreDisplay'
import type { MatchState } from '@/lib/types/match'

export default function LivePage() {
  const params = useParams()
  const courtIdentifier = params.id as string
  const [courtId, setCourtId] = useState<string | null>(null)
  const [match, setMatch] = useState<MatchState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!courtIdentifier) return

    // Resolve court ID from slug or UUID
    async function resolveCourt() {
      try {
        const court = await getCourtBySlug(courtIdentifier)
        if (!court) {
          setError('Court not found')
          setLoading(false)
          return
        }
        setCourtId(court.id)
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
      .channel(`live-${courtId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_matches',
          filter: `court_id=eq.${courtId}`,
        },
        (payload) => {
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
      .subscribe()

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
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#fff',
        fontSize: '1.5rem'
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
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#ef4444',
        fontSize: '1.5rem',
        padding: '2rem',
        textAlign: 'center'
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
        minHeight: '100vh',
        background: '#1a1a2e',
        color: '#fff',
        fontSize: '2rem',
        textAlign: 'center',
        padding: '2rem'
      }}>
        No active match
      </div>
    )
  }

  return <ScoreDisplay match={match} variant="spectator" />
}
