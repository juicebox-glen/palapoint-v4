'use client'

import { useParams } from 'next/navigation'

import { MatchplayBoard } from '@/components/matchplay/MatchplayBoard'

export default function MatchplayBoardPage() {
  const params = useParams()
  const eventId = params.id as string

  return <MatchplayBoard eventId={eventId} />
}
