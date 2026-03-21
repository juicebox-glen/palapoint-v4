import { supabase } from '../supabase'

/**
 * Returns the Supabase client instance.
 * Use this for server components and shared client access.
 */
export function createClient() {
  return supabase
}
