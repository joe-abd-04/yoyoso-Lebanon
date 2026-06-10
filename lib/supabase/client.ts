// BROWSER CLIENT — safe to import in client components ('use client').
// Uses the public anon (publishable) key, which is safe to expose. RLS controls
// what the anon/authenticated roles can access.
//
// Built with @supabase/ssr's createBrowserClient so the auth session is stored
// in cookies (shared with the server via middleware), not just localStorage.
// createBrowserClient memoizes one instance per (url,key), so it's fine to call
// createClient() from many components.
//
// Usage in a client component:
//   import { createClient } from '@/lib/supabase/client'
//   const supabase = createClient()
//   await supabase.auth.signInWithPassword({ email, password })

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
}
