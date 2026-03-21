'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCourtBySlug } from '@/lib/supabase'
import { getVenueBranding, type VenueBranding } from '@/lib/supabase/venue'
import PlayingDisplay from '@/components/displays/PlayingDisplay'

export default function PlayingPage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const [courtId, setCourtId] = useState<string | null>(null)
  const [courtSlug, setCourtSlug] = useState<string | null>(null)
  const [courtName, setCourtName] = useState<string>('')
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (segments.length === 0) {
      setError('Invalid URL. Use /playing/[court-slug] or /playing/[company]/[venue]/[court]')
      setLoading(false)
      return
    }

    async function resolve() {
      try {
        if (segments.length === 3) {
          const [company, venue, court] = segments
          const result = await getVenueBranding(company!, venue!, court!)
          if (result) {
            setCourtId(result.courtId)
            setCourtSlug(segments.join('/'))
            setCourtName(result.courtName)
            setBranding(result)
          } else {
            setError('Venue not found')
          }
        } else if (segments.length === 1) {
          const court = await getCourtBySlug(segments[0]!)
          if (court) {
            setCourtId(court.id)
            setCourtSlug(segments[0]!)
            setCourtName(court.name || segments[0]!)
            setBranding(null)
          } else {
            setError('Court not found')
          }
        } else {
          setError('Invalid URL')
        }
      } catch (err) {
        console.error('Error resolving court:', err)
        setError('Failed to load court')
      }
      setLoading(false)
    }

    resolve()
  }, [segments])

  if (loading) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <div className="page-loading" style={{ flex: 1, paddingTop: '20px' }}>
          <p style={{ color: 'var(--text-secondary)' }}>Loading...</p>
        </div>
      </div>
    )
  }

  if (error || !courtId || !courtSlug) {
    return (
      <div className="page page-padded" style={{ paddingTop: '1rem' }}>
        <div className="page-loading" style={{ flex: 1, paddingTop: '20px' }}>
          <p style={{ fontSize: '1.5rem', color: 'var(--color-error)' }}>
            {error ?? 'Court not found'}
          </p>
        </div>
      </div>
    )
  }

  if (branding) {
    return (
      <div
        style={
          {
            '--brand-primary': branding.primaryColor,
            '--team-a': branding.primaryColor,
            '--team-b': branding.secondaryColor,
          } as React.CSSProperties
        }
      >
        <PlayingDisplay
          courtId={courtId}
          courtSlug={courtSlug}
          courtName={courtName}
          branding={branding}
        />
      </div>
    )
  }

  return (
    <PlayingDisplay
      courtId={courtId}
      courtSlug={courtSlug}
      courtName={courtName}
      branding={null}
    />
  )
}
