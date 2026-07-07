'use client'

import { useSyncExternalStore } from 'react'

function formatClockTime(date: Date): string {
  const hours = date.getHours().toString().padStart(2, '0')
  const minutes = date.getMinutes().toString().padStart(2, '0')
  return `${hours}:${minutes}`
}

function subscribeToClock(onStoreChange: () => void) {
  const id = window.setInterval(onStoreChange, 1000)
  return () => window.clearInterval(id)
}

function getClockSnapshot() {
  return formatClockTime(new Date())
}

function getClockServerSnapshot() {
  return '--:--'
}

export interface KinkFrameClockProps {
  weatherIcon?: string
}

export function KinkFrameClock({ weatherIcon = '⛅' }: KinkFrameClockProps) {
  const time = useSyncExternalStore(
    subscribeToClock,
    getClockSnapshot,
    getClockServerSnapshot
  )

  const [hours, minutes] = time.split(':')

  return (
    <div className="kink-frame-clock" aria-live="polite" aria-label={`Current time ${time}`}>
      <div className="kink-frame-clock-icon">
        <span aria-hidden>{weatherIcon}</span>
      </div>
      <div className="kink-frame-clock-body">
        <time className="kink-frame-clock-time" dateTime={time}>
          <span className="kink-frame-clock-hours">{hours}</span>
          <span className="kink-frame-clock-sep" aria-hidden>
            :
          </span>
          <span className="kink-frame-clock-minutes">{minutes}</span>
        </time>
      </div>
    </div>
  )
}
