'use client'

import { useEffect, useState } from 'react'

function formatParts(date: Date): { hh: string; mm: string } {
  return {
    hh: date.getHours().toString().padStart(2, '0'),
    mm: date.getMinutes().toString().padStart(2, '0'),
  }
}

/** Client-side clock — reserves the space on server render, fills in after mount to avoid hydration mismatch. */
export function PalaLiveClock() {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 15000)
    return () => clearInterval(interval)
  }, [])

  if (!now) {
    return <span className="palalive-clock" aria-hidden />
  }

  const { hh, mm } = formatParts(now)

  return (
    <span className="palalive-clock">
      {hh}
      <span className="palalive-clock-colon">:</span>
      {mm}
    </span>
  )
}
