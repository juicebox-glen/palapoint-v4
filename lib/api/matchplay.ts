const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export type MatchplayApiResult = {
  success?: boolean
  error?: string
  event?: unknown
  events?: unknown
  player?: unknown
  players?: unknown
  standings?: unknown
  round?: unknown
  rounds?: unknown
  [key: string]: unknown
}

async function callMatchplayFunction(
  functionName: 'matchplay-event' | 'matchplay-player' | 'matchplay-round',
  body: Record<string, unknown>
): Promise<MatchplayApiResult> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  })

  const text = await res.text()
  let parsed: MatchplayApiResult
  try {
    parsed = text ? (JSON.parse(text) as MatchplayApiResult) : {}
  } catch {
    console.error(`[matchplay] ${functionName} non-JSON body:`, text.slice(0, 300))
    return { success: false, error: 'invalid_server_response' }
  }

  if (!res.ok) {
    return {
      ...parsed,
      success: typeof parsed.success === 'boolean' ? parsed.success : false,
      error: (parsed.error as string | undefined) ?? `HTTP ${res.status}`,
    }
  }

  return parsed
}

export function callMatchplayEvent(body: Record<string, unknown>): Promise<MatchplayApiResult> {
  return callMatchplayFunction('matchplay-event', body)
}

export function callMatchplayPlayer(body: Record<string, unknown>): Promise<MatchplayApiResult> {
  return callMatchplayFunction('matchplay-player', body)
}

export function callMatchplayRound(body: Record<string, unknown>): Promise<MatchplayApiResult> {
  return callMatchplayFunction('matchplay-round', body)
}
