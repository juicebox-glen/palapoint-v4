'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import type { VenueScreen } from '@/lib/types/venue-screen'
import { VENUE_SCREEN_PUBLIC_SELECT } from '@/lib/types/venue-screen'

export interface UseVenueScreenResult {
  screen: VenueScreen | null
  isLoading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useVenueScreen(screenSlug: string | null): UseVenueScreenResult {
  const [screen, setScreen] = useState<VenueScreen | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)

  const fetchScreen = useCallback(async () => {
    if (!screenSlug) {
      setScreen(null)
      setError('Missing screen slug')
      setIsLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('venue_screens')
        .select(VENUE_SCREEN_PUBLIC_SELECT)
        .eq('screen_slug', screenSlug)
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
        setScreen(null)
      } else if (!data) {
        setError('Screen not found')
        setScreen(null)
      } else {
        setScreen(data as VenueScreen)
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load screen')
      setScreen(null)
    } finally {
      setIsLoading(false)
    }
  }, [screenSlug])

  const refetch = useCallback(async () => {
    setIsLoading(true)
    await fetchScreen()
  }, [fetchScreen])

  useEffect(() => {
    if (!screenSlug) {
      setIsLoading(false)
      return
    }

    setIsLoading(true)
    void fetchScreen()

    const ch = supabase
      .channel(`venue-screen-${screenSlug}`)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(ch as any).on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'venue_screens',
          filter: `screen_slug=eq.${screenSlug}`,
        },
        (payload: { new?: Record<string, unknown> }) => {
          if (payload.new) {
            setScreen(payload.new as unknown as VenueScreen)
            setError(null)
          } else {
            void fetchScreen()
          }
        }
      )

    ch.subscribe()
    channelRef.current = ch

    const poll = setInterval(() => {
      void fetchScreen()
    }, 5000)

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      clearInterval(poll)
    }
  }, [screenSlug, fetchScreen])

  return { screen, isLoading, error, refetch }
}
