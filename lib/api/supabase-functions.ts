const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

/** Headers required by the Supabase Edge Functions gateway (JWT verification). */
export function supabaseFunctionHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (SUPABASE_ANON_KEY) {
    headers.Authorization = `Bearer ${SUPABASE_ANON_KEY}`
    headers.apikey = SUPABASE_ANON_KEY
  }
  return headers
}

export { SUPABASE_URL }
