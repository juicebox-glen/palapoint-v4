'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'

import { MatchplayLauncherModePicker } from '@/components/MatchplayLauncherModePicker'
import { StaffAppFrame } from '@/components/venue-screen/StaffAppFrame'
import { getVenueScreenStaffContext } from '@/lib/venue-screen-staff-context'

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
    <StaffAppFrame
      venueSlug={venueSlug}
      onBack={() => router.push(`/staff/${venueSlug}`)}
    >
      <MatchplayLauncherModePicker staffVenueSlug={venueSlug} />
    </StaffAppFrame>
  )
}
