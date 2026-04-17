'use client'

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { LIVE_MATCH_FULL_SELECT } from '@/lib/supabase/selects'

const DEFAULT_STATUS_FILTER: string[] = [
  'setup',
  'in_progress',
  'completed',
  'abandoned',
]

export interface UseLiveMatchOptions {
  /** Custom select list (comma-separated column names) */
  select?: string
  statusFilter?: string[]
  pollInterval?: number
  enablePolling?: boolean
}

export interface UseLiveMatchResult<T> {
  match: T | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Live `live_matches` row for a court: initial fetch, Realtime, optional polling, cleanup.
 */
export function useLiveMatch<T = unknown>(
  courtId: string | null,
  options: UseLiveMatchOptions = {}
): UseLiveMatchResult<T> {
  const {
    select = LIVE_MATCH_FULL_SELECT,
    statusFilter = DEFAULT_STATUS_FILTER,
    pollInterval = 5000,
    enablePolling = true,
  } = options

  const statusKey = useMemo(() => statusFilter.slice().sort().join(','), [statusFilter])

  const [match, setMatch] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const channelRef = useRef<RealtimeChannel | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const statusFilterRef = useRef(statusFilter)
  statusFilterRef.current = statusFilter

  const fetchMatch = useCallback(async () => {
    if (!courtId) {
      setMatch(null)
      setError(null)
      setIsLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('live_matches')
        .select(select)
        .eq('court_id', courtId)
        .in('status', statusFilter)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (fetchError) {
        console.error('useLiveMatch fetch:', fetchError)
        setError(fetchError.message)
        setMatch(null)
      } else {
        setMatch(data as T | null)
        setError(null)
      }
    } catch (err) {
      console.error('useLiveMatch:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch match')
      setMatch(null)
    } finally {
      setIsLoading(false)
    }
  }, [courtId, select, statusKey])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchMatch()
  }, [fetchMatch])

  useEffect(() => {
    if (!courtId) {
      setMatch(null)
      setError(null)
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    void fetchMatch()

    const ch = supabase
      .channel(`live-match-${courtId}`)
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
          new?: Record<string, unknown>
          old?: Record<string, unknown>
        }) => {
          if (payload.eventType === 'DELETE') {
            void fetchMatch()
            return
          }

          const row = payload.new
          if (!row) {
            void fetchMatch()
            return
          }

          const st = row.status as string | undefined
          const allowed = statusFilterRef.current
          if (st != null && allowed.includes(st)) {
            setMatch(row as T)
            setError(null)
          } else {
            void fetchMatch()
          }
        }
      )

    ch.subscribe()
    channelRef.current = ch

    if (enablePolling) {
      pollRef.current = setInterval(() => {
        void fetchMatch()
      }, pollInterval)
    }

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      if (pollRef.current) {
        clearInterval(pollRef.current)
        pollRef.current = null
      }
    }
  }, [courtId, fetchMatch, enablePolling, pollInterval, statusKey])

  return { match, isLoading, error, refetch }
}
