'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { getCourtBySlug } from '@/lib/supabase'
import { getVenueBranding, type VenueBranding } from '@/lib/supabase/venue'
import ControlPanel from '@/components/displays/ControlPanel'

export default function ControlPage() {
  const params = useParams()
  const segments = (params.segments as string[] | undefined) ?? []

  const [courtId, setCourtId] = useState<string | null>(null)
  const [branding, setBranding] = useState<VenueBranding | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (segments.length === 0) {
      setError('Invalid URL. Use /control/[court-slug] or /control/[company]/[venue]/[court]')
      setLoading(false)
      return
    }

    async function load() {
      try {
        if (segments.length === 3) {
          const [company, venue, court] = segments
          const result = await getVenueBranding(company!, venue!, court!)
          if (result) {
            setCourtId(result.courtId)
            setBranding(result)
          } else {
            setError('Venue not found')
          }
        } else if (segments.length === 1) {
          const court = await getCourtBySlug(segments[0]!)
          if (court) {
            setCourtId(court.id)
            setBranding(null)
          } else {
            setError('Court not found')
          }
        } else {
          setError('Invalid URL')
        }
      } catch (err) {
        console.error('Error loading control:', err)
        setError('Failed to load court')
      }
      setLoading(false)
    }

    load()
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

  if (error || !courtId) {
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

  return (
    <div
      style={
        {
          '--brand-primary': branding?.primaryColor ?? '#5B6CFF',
          '--team-a': branding?.primaryColor ?? '#5B6CFF',
          '--team-b': branding?.secondaryColor ?? '#E84A8A',
        } as React.CSSProperties
      }
    >
      <ControlPanel courtId={courtId} branding={branding} />
    </div>
  )
}
