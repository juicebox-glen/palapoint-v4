'use client'

import { useEffect, useState } from 'react'
import { getMatchplayVenueHeaderBranding, type MatchplayVenueHeaderBranding } from '@/lib/supabase'

const STORAGE_KEY = 'palapoint_matchplay_branding'

function readStoredBranding(): MatchplayVenueHeaderBranding | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as MatchplayVenueHeaderBranding
    if (p && typeof p.companyName === 'string') return p
  } catch {
    /* ignore */
  }
  return null
}

/** Venue / company header for matchplay setup (cached in sessionStorage). */
export function useMatchplaySetupBranding() {
  const [branding, setBranding] = useState<MatchplayVenueHeaderBranding | null>(() => readStoredBranding())

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const b = await getMatchplayVenueHeaderBranding()
      if (cancelled || !b) return
      setBranding(b)
      try {
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(b))
      } catch {
        /* quota */
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return branding
}
