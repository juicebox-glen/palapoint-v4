'use client'

import { useCallback, useEffect, useState } from 'react'
import type { StatusPayload } from '@/lib/api/status'
import '@/app/styles/status.css'

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 60_000) return 'just now'
  const mins = Math.floor(ms / 60_000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function formatWhen(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export default function StatusPage() {
  const [data, setData] = useState<StatusPayload | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/status', { cache: 'no-store' })
      const body = (await res.json()) as StatusPayload & { error?: string }
      if (!res.ok) {
        setError(body.error ?? 'Failed to load')
        setData(null)
        return
      }
      setData(body)
      setError(null)
    } catch {
      setError('Network error')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const interval = setInterval(() => void load(), 60_000)
    return () => clearInterval(interval)
  }, [load])

  return (
    <div className="status-page">
      <div className="status-shell">
        <header className="status-header">
          <h1>PalaPoint status</h1>
          <p>Games started · UK time · refreshes every minute</p>
        </header>

        {loading && !data ? (
          <p className="status-muted">Loading…</p>
        ) : error ? (
          <div className="status-error">
            <p>{error}</p>
            <p className="status-muted">
              Add <code>SUPABASE_SERVICE_ROLE_KEY</code> to Vercel env vars and redeploy.
            </p>
          </div>
        ) : data ? (
          <>
            <div className="status-stats">
              <div className="status-stat">
                <div className="status-stat-num">{data.gamesToday}</div>
                <div className="status-stat-label">Today</div>
              </div>
              <div className="status-stat">
                <div className="status-stat-num">{data.gamesThisWeek}</div>
                <div className="status-stat-label">This week</div>
              </div>
              <div className="status-stat">
                <div className="status-stat-num">{data.playingNow}</div>
                <div className="status-stat-label">Live now</div>
              </div>
            </div>

            <p className="status-last">
              {data.lastActivity ? (
                <>
                  Last game started <strong>{timeAgo(data.lastActivity)}</strong>
                  <span className="status-muted"> ({formatWhen(data.lastActivity)})</span>
                </>
              ) : (
                <span className="status-muted">No games started yet this month</span>
              )}
            </p>

            {data.recent.length > 0 ? (
              <div className="status-recent">
                <h2>Recent</h2>
                <ul>
                  {data.recent.map((game) => (
                    <li key={game.id}>
                      <span className="status-recent-main">
                        {game.venue} · {game.court}
                      </span>
                      <span className="status-recent-meta">
                        {formatWhen(game.at)} · {game.status.replace('_', ' ')}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
