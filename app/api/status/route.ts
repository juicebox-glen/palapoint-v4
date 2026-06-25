import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import type { StatusPayload, StatusRecentGame } from '@/lib/api/status'

type CourtJoin = { name?: string | null; venues?: { name?: string | null; slug?: string | null } | null }

type LiveRow = {
  id: string
  started_at: string | null
  status: string
  courts?: CourtJoin | CourtJoin[] | null
}

type ArchivedRow = {
  id: string
  started_at: string | null
  courts?: CourtJoin | CourtJoin[] | null
}

function unwrapJoin<T>(raw: T | T[] | null | undefined): T | null {
  if (raw == null) return null
  return Array.isArray(raw) ? raw[0] ?? null : raw
}

function ukDateKey(iso: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso))
}

function isTodayUk(iso: string): boolean {
  return ukDateKey(iso) === ukDateKey(new Date().toISOString())
}

function startOfWeekUkMs(): number {
  const now = new Date()
  const weekday = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/London', weekday: 'short' }).format(now)
  const weekdayIndex = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(weekday)
  const offset = weekdayIndex < 0 ? 0 : weekdayIndex
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const year = Number(parts.find((p) => p.type === 'year')?.value)
  const month = Number(parts.find((p) => p.type === 'month')?.value)
  const day = Number(parts.find((p) => p.type === 'day')?.value)
  return Date.UTC(year, month - 1, day - offset)
}

function isThisWeekUk(iso: string): boolean {
  return new Date(iso).getTime() >= startOfWeekUkMs()
}

function courtLabel(courts: LiveRow['courts']): { court: string; venue: string } {
  const court = unwrapJoin(courts)
  const venue = unwrapJoin(court?.venues)
  return {
    court: court?.name?.trim() || 'Court',
    venue: venue?.name?.trim() || venue?.slug?.trim() || 'Venue',
  }
}

export async function GET() {
  let supabase
  try {
    supabase = createServerClient()
  } catch {
    return NextResponse.json(
      { error: 'Status page not configured (add SUPABASE_SERVICE_ROLE_KEY to Vercel)' },
      { status: 503 }
    )
  }

  const monthStart = new Date()
  monthStart.setUTCDate(1)
  monthStart.setUTCHours(0, 0, 0, 0)

  const [liveRes, archivedRes, activeRes] = await Promise.all([
    supabase
      .from('live_matches')
      .select('id, started_at, status, courts(name, venues(name, slug))')
      .not('started_at', 'is', null)
      .gte('started_at', monthStart.toISOString())
      .order('started_at', { ascending: false })
      .limit(2000),
    supabase
      .from('matches')
      .select('id, started_at, courts(name, venues(name, slug))')
      .gte('started_at', monthStart.toISOString())
      .order('started_at', { ascending: false })
      .limit(2000),
    supabase
      .from('live_matches')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'in_progress'),
  ])

  if (liveRes.error) {
    return NextResponse.json({ error: liveRes.error.message }, { status: 500 })
  }
  if (archivedRes.error) {
    return NextResponse.json({ error: archivedRes.error.message }, { status: 500 })
  }

  const tries: StatusRecentGame[] = []

  for (const row of (liveRes.data ?? []) as LiveRow[]) {
    if (!row.started_at) continue
    const { court, venue } = courtLabel(row.courts)
    tries.push({ id: row.id, at: row.started_at, status: row.status, court, venue })
  }

  for (const row of (archivedRes.data ?? []) as ArchivedRow[]) {
    if (!row.started_at) continue
    const { court, venue } = courtLabel(row.courts)
    tries.push({ id: `archived-${row.id}`, at: row.started_at, status: 'completed', court, venue })
  }

  tries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())

  const payload: StatusPayload = {
    gamesToday: tries.filter((row) => isTodayUk(row.at)).length,
    gamesThisWeek: tries.filter((row) => isThisWeekUk(row.at)).length,
    playingNow: activeRes.count ?? 0,
    lastActivity: tries[0]?.at ?? null,
    recent: tries.slice(0, 8),
  }

  return NextResponse.json(payload, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  })
}
