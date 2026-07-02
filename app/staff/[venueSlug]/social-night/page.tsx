'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import { StaffPageShell } from '@/components/venue-screen/StaffPageShell'
import { getVenueScreenStaffContext } from '@/lib/venue-screen-staff-context'

import '@/app/styles/matchplay.css'
import '@/app/styles/setup-form.css'

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

  return (
    <StaffPageShell venueSlug={venueSlug}>
      <div className="matchplay-launcher matchplay-launcher--compact">
        <MatchplayLauncherModePicker staffVenueSlug={venueSlug} />
      </div>
    </StaffPageShell>
  )
}
