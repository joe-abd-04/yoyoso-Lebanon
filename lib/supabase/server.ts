// SERVER ONLY — NEVER import this file in client components ('use client') or
// any file that ships to the browser. The SUPABASE_SECRET_KEY is the service-role
// key which bypasses Row Level Security, giving full unrestricted admin access
// to every table. Exposing it to the browser would be a critical security hole.
//
// Use this in:
//   - Server Components (default in app/ with no 'use client' directive)
//   - Route Handlers (app/api/*/route.ts)
//   - Server Actions
//
// Usage:
//   import { createServerClient } from '@/lib/supabase/server'
//   const supabase = createServerClient()
//   const { data } = await supabase.from('orders').select('*')

import { createClient } from '@supabase/supabase-js'
import type { Database } from './types'

export function createServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SECRET_KEY

  if (!url || !key) {
    throw new Error(
      'Missing Supabase server env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and ' +
        'SUPABASE_SECRET_KEY are set in .env.local (server-side only).'
    )
  }

  // autoRefreshToken and persistSession are disabled — server clients are
  // short-lived per-request, not long-lived browser sessions.
  return createClient<Database>(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
