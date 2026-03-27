import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

// Return a real client if configured, otherwise a dummy that returns empty results
function getClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a proxy that makes all queries return empty data
    return new Proxy({} as SupabaseClient, {
      get: () => (..._args: unknown[]) => ({
        select: () => ({ eq: () => ({ eq: () => ({ order: () => ({ data: [], error: null }), single: () => ({ data: null, error: null }) }), order: () => ({ data: [], error: null }), single: () => ({ data: null, error: null }) }), order: () => ({ data: [], error: null }) }),
        data: [],
        error: null,
      }),
    })
  }
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = getClient()
