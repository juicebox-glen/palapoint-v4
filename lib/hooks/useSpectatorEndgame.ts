'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'

import { supabase } from '@/lib/supabase'
import { SPECTATOR_ENDGAME_DISPLAY_MS } from '@/lib/showcase-timing'
import type { MatchState } from '@/lib/types/match'
import { isMatchEndgame } from '@/lib/utils/match-status'

/**
 * Any terminal match holds — including one abandoned before any set was won, which has
 * no resolvable winner. MatchFinishedPanel / PalaLiveShowcaseEndgameView already render
 * that case (falls back to "MATCH COMPLETE", no winner avatars); this just has to reach it.
 */
function isShowableEndgame(row: MatchState): boolean {
  return isMatchEndgame(row)
}

export interface UseSpectatorEndgameOptions {
  /** How long to keep the endgame screen visible (default: standalone spectator routes). */
  displayMs?: number
  /** Scope to a specific match instead of "any completed match on this court." */
  matchId?: string
}

/**
 * Brief endgame screen when a court match finishes — driven by Realtime only.
 * Stale completed rows in the DB are ignored so idle courts stay on the idle layout.
 */
export function useSpectatorEndgame(
  courtId: string | null,
  options: UseSpectatorEndgameOptions = {}
): MatchState | null {
  const displayMs = options.displayMs ?? SPECTATOR_ENDGAME_DISPLAY_MS
  const matchId = options.matchId
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
      }, displayMs)
    },
    [clearDismissTimer, displayMs]
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
          if (matchId && payload.old?.id !== matchId) return
          setEndgameMatch((prev) =>
            prev && payload.old?.id === prev.id ? null : prev
          )
          clearDismissTimer()
          return
        }

        if (!row) return
        if (matchId && row.id !== matchId) return

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
  }, [courtId, matchId, clearDismissTimer, showEndgame])

  return endgameMatch
}
