import { Suspense } from 'react'
import type { Metadata } from 'next'

import { VenueScreenDisplay } from '@/components/venue-screen/VenueScreenDisplay'

export const metadata: Metadata = {
  title: 'PalaPoint Live — Venue Screen',
  description: 'Permanent venue display URL',
}

interface ScreenPageProps {
  params: Promise<{ screenSlug: string }>
}

export default async function ScreenPage({ params }: ScreenPageProps) {
  const { screenSlug } = await params

  return (
    <Suspense fallback={null}>
      <VenueScreenDisplay screenSlug={screenSlug} />
    </Suspense>
  )
}
