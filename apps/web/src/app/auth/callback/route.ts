import { createServerClient } from '@nexo/core-auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'
  const inviteToken = searchParams.get('invite_token')

  if (code) {
    const supabase = await createServerClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      if (inviteToken) {
        return NextResponse.redirect(
          new URL(`/onboarding/cuenta?invite=${inviteToken}`, origin)
        )
      }
      return NextResponse.redirect(new URL(next, origin))
    }

    return NextResponse.redirect(
      new URL(`/auth-error?message=${encodeURIComponent(error.message)}`, origin)
    )
  }

  return NextResponse.redirect(new URL('/auth-error', origin))
}
