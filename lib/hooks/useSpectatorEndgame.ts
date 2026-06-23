'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { resolveFinishedWinnerSide } from '@/components/shared/MatchFinishedPanel'
import { supabase } from '@/lib/supabase'
import type { MatchState } from '@/lib/types/match'
import { isMatchEndgame } from '@/lib/utils/match-status'

/** Same duration as court `MatchWinOverlay`. */
const ENDGAME_DISPLAY_MS = 15_000

function isShowableEndgame(row: MatchState): boolean {
  return isMatchEndgame(row) && resolveFinishedWinnerSide(row) !== null
}

/**
 * Brief endgame screen when a court match finishes — driven by Realtime only.
 * Stale completed rows in the DB are ignored so idle courts stay on the idle layout.
 */
export function useSpectatorEndgame(courtId: string | null): MatchState | null {
  const [endgameMatch, setEndgameMatch] = useState<MatchState | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearDismissTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const showEndgame = useCallback(
    (match: MatchState) => {
      clearDismissTimer()
      setEndgameMatch(match)
      timerRef.current = setTimeout(() => {
        setEndgameMatch(null)
      }, ENDGAME_DISPLAY_MS)
    },
    [clearDismissTimer]
  )

  useEffect(() => {
    if (!courtId) {
      setEndgameMatch(null)
      clearDismissTimer()
      return
    }

    const ch = supabase.channel(`spectator-endgame-${courtId}`)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Supabase channel .on() overload resolution
    ;(ch as any).on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'live_matches',
        filter: `court_id=eq.${courtId}`,
      },
      (payload: {
        eventType?: string
        new?: MatchState
        old?: { id?: string }
      }) => {
        const eventType = payload.eventType
        const row = payload.new

        if (eventType === 'DELETE') {
          setEndgameMatch((prev) =>
            prev && payload.old?.id === prev.id ? null : prev
          )
          clearDismissTimer()
          return
        }

        if (!row) return

        if (row.status === 'setup' || row.status === 'in_progress') {
          setEndgameMatch(null)
          clearDismissTimer()
          return
        }

        if (isShowableEndgame(row)) {
          showEndgame(row)
        }
      }
    )

    ch.subscribe()

    return () => {
      clearDismissTimer()
      supabase.removeChannel(ch)
    }
  }, [courtId, clearDismissTimer, showEndgame])

  return endgameMatch
}
