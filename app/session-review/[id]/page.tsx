'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { getVenueBrandingForCourtId, type VenueBranding } from '@/lib/venue'
import SessionReviewDisplay, {
  type SessionReviewGame,
  type SessionReviewSession,
} from '@/components/displays/SessionReviewDisplay'

export default function SessionReviewPage() {
  const params = useParams()
  const router = useRouter()
  const sessionId = params.id as string

  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState<SessionReviewSession | null>(null)
  const [games, setGames] = useState<SessionReviewGame[]>([])
  const [courtName, setCourtName] = useState('')
  const [branding, setBranding] = useState<VenueBranding | null>(null)

  useEffect(() => {
    async function loadData() {
      const { data: sessionData } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (sessionData) {
        setSession(sessionData as SessionReviewSession)

        const brand = await getVenueBrandingForCourtId(sessionData.court_id)
        setBranding(brand)

        if (brand?.courtName) {
          setCourtName(brand.courtName)
        } else {
          const { data: court } = await supabase
            .from('courts')
            .select('name')
            .eq('id', sessionData.court_id)
            .single()

          if (court) {
            setCourtName(court.name || 'Court')
          }
        }
      }

      const [liveResult, archivedResult] = await Promise.all([
        supabase
          .from('live_matches')
          .select('*')
          .eq('session_id', sessionId)
          .in('status', ['completed', 'abandoned'])
          .order('created_at', { ascending: true }),
        supabase
          .from('matches')
          .select('*')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true }),
      ])

      const archivedIds = new Set(
        (archivedResult.data || [])
          .map((g: SessionReviewGame) => g.live_match_id)
          .filter(Boolean)
      )
      const liveOnly = (liveResult.data || []).filter(
        (g: SessionReviewGame) => !archivedIds.has(g.id)
      )
      const allGames = [...(archivedResult.data || []), ...liveOnly]

      allGames.sort(
        (a: SessionReviewGame, b: SessionReviewGame) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      if (allGames.length > 0) setGames(allGames)

      setLoading(false)
    }

    loadData()
  }, [sessionId])

  return (
    <SessionReviewDisplay
      courtName={courtName}
      session={session}
      games={games}
      loading={loading}
      branding={branding}
      onGameClick={(gameId) => router.push(`/game/${gameId}`)}
    />
  )
}
