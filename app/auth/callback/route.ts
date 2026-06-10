// OAuth callback (e.g. Google sign-in). Supabase redirects here with a `code`
// that we exchange for a cookie session. Not active until the Google provider
// is configured in Supabase — see the setup notes / SECURITY-TODO.
// TODO: configure Google OAuth provider in Supabase to enable this route.

import { NextResponse, type NextRequest } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createServerAuthClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Behind a proxy/load balancer in prod, honour the forwarded host.
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocal = process.env.NODE_ENV === 'development'
      if (isLocal) return NextResponse.redirect(`${origin}${next}`)
      if (forwardedHost)
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
