// Email-link handler for sign-up confirmation AND password recovery.
//
// Robust to BOTH Supabase email-template styles so it works whether or not the
// templates are customized:
//   1. token_hash flow (recommended, cross-browser): the template links to
//      {{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type={{ .Type }}&next=...
//      → we verifyOtp(token_hash).
//   2. code flow (Supabase default, same-browser): the default {{ .ConfirmationURL }}
//      routes through Supabase's verify endpoint, which redirects here with ?code=...
//      → we exchangeCodeForSession(code).
// Either way a cookie session is established, then we redirect to `next`.

import { type EmailOtpType } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'
import { createServerAuthClient } from '@/lib/supabase/server-auth'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const code = searchParams.get('code')
  // Recovery links go to the reset page; confirmations go home (or wherever).
  const next = searchParams.get('next') ?? '/'

  const supabase = await createServerAuthClient()

  if (token_hash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
  }

  // Invalid or expired link.
  return NextResponse.redirect(`${origin}/login?error=link_invalid`)
}
