// SERVER AUTH CLIENT — for reading the *logged-in user* in Server Components,
// Route Handlers, and Server Actions. Uses the public anon key + the request
// cookies (via @supabase/ssr), so all queries run under the user's RLS context
// (NOT admin). This is different from lib/supabase/server.ts, which uses the
// service-role secret key for privileged catalog reads and bypasses RLS.
//
// Usage:
//   const supabase = await createServerAuthClient()
//   const { data: { user } } = await supabase.auth.getUser()

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from './types'

export async function createServerAuthClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session cookie, so this is safe to
            // ignore here.
          }
        },
      },
    },
  )
}

/** Convenience: the current authenticated user (or null). Safe in Server Components. */
export async function getCurrentUser() {
  const supabase = await createServerAuthClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
}
