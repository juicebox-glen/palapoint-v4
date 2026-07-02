'use client'

import { useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import { StaffPageShell } from '@/components/venue-screen/StaffPageShell'
import {
  getVenueScreenStaffContext,
  saveVenueScreenStaffContext,
} from '@/lib/venue-screen-staff-context'

export default function StaffSocialNightPage() {
  const router = useRouter()
  const params = useParams()
  const venueSlug = (params.venueSlug as string | undefined) ?? ''

  useEffect(() => {
    const ctx = getVenueScreenStaffContext()
    if (!ctx || ctx.venueSlug !== venueSlug) {
      router.replace(`/staff/${venueSlug}`)
    }
  }, [router, venueSlug])

  const staffQuery = useMemo(() => {
    const ctx = getVenueScreenStaffContext()
    if (!ctx) return ''
    saveVenueScreenStaffContext(ctx)
    const qs = new URLSearchParams({
      venue: ctx.venueSlug,
      screen: ctx.screenSlug,
    })
    return `?${qs.toString()}`
  }, [venueSlug])

  return (
    <StaffPageShell venueSlug={venueSlug}>
      <p className="staff-prompt">Select game mode</p>
      <MatchplayLauncherModePicker staffQuery={staffQuery} />
    </StaffPageShell>
  )
}
