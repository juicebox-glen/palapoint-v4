const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const SESSION_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/session`

interface SessionSettings {
  game_mode: 'traditional' | 'golden_point' | 'silver_point'
  sets_to_win: 1 | 2
  tiebreak_at: 6 | 7
  side_swap_enabled: boolean
}

interface Session {
  id: string
  court_id: string
  status: 'active' | 'expired' | 'ended'
  settings: SessionSettings
  team_a_player_1: string | null
  team_a_player_2: string | null
  team_b_player_1: string | null
  team_b_player_2: string | null
  started_at: string
  last_activity: string
  ended_at: string | null
  games_count?: number
  minutes_active?: number
  minutes_since_activity?: number
}

interface CheckSessionResponse {
  success: boolean
  has_active_session: boolean
  session: Session | null
}

interface CreateSessionResponse {
  success: boolean
  session?: Session
  error?: string
}

interface EndSessionResponse {
  success: boolean
  session?: Session
  games?: unknown[]
  error?: string
}

export async function checkSession(courtId: string): Promise<CheckSessionResponse> {
  const response = await fetch(SESSION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'check',
      court_id: courtId,
    }),
  })

  return response.json()
}

export async function createSession(
  courtId: string,
  settings?: Partial<SessionSettings>,
  players?: {
    team_a_player_1?: string
    team_a_player_2?: string
    team_b_player_1?: string
    team_b_player_2?: string
  }
): Promise<CreateSessionResponse> {
  const response = await fetch(SESSION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'create',
      court_id: courtId,
      settings,
      ...players,
    }),
  })

  return response.json()
}

export async function takeoverSession(
  courtId: string,
  settings?: Partial<SessionSettings>,
  players?: {
    team_a_player_1?: string
    team_a_player_2?: string
    team_b_player_1?: string
    team_b_player_2?: string
  }
): Promise<CreateSessionResponse> {
  const response = await fetch(SESSION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'takeover',
      court_id: courtId,
      settings,
      ...players,
    }),
  })

  return response.json()
}

export async function validateSession(sessionId: string): Promise<{
  success: boolean
  valid: boolean
  reason?: string
  session?: Session
}> {
  const response = await fetch(SESSION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'validate',
      session_id: sessionId,
    }),
  })

  return response.json()
}

export async function endSession(sessionId: string): Promise<EndSessionResponse> {
  const response = await fetch(SESSION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'end',
      session_id: sessionId,
    }),
  })

  return response.json()
}

export async function updateSessionActivity(
  sessionId: string
): Promise<{ success: boolean }> {
  const response = await fetch(SESSION_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      action: 'update_activity',
      session_id: sessionId,
    }),
  })

  return response.json()
}
