import { createServerClient } from '@nexo/core-auth';
import { NextRequest, NextResponse } from 'next/server';

type SupportedOtpType = 'signup' | 'invite' | 'magiclink';

const SUPPORTED_OTP_TYPES = new Set<string>(['signup', 'invite', 'magiclink']);

function isSupportedOtpType(value: string | null): value is SupportedOtpType {
  return Boolean(value && SUPPORTED_OTP_TYPES.has(value));
}

function getSafeRedirectPath(value: string | null): string {
  if (!value || !value.startsWith('/')) return '/dashboard';
  if (value.startsWith('//')) return '/dashboard';
  return value;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');
  const next = getSafeRedirectPath(searchParams.get('next'));
  const inviteToken = searchParams.get('invite_token');
  const supabase = await createServerClient();

  if (tokenHash && isSupportedOtpType(type)) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      if (inviteToken) {
        return NextResponse.redirect(new URL(`/onboarding/cuenta?invite=${inviteToken}`, origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }

    return NextResponse.redirect(
      new URL(`/auth-error?message=${encodeURIComponent(error.message)}`, origin),
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      if (inviteToken) {
        return NextResponse.redirect(new URL(`/onboarding/cuenta?invite=${inviteToken}`, origin));
      }
      return NextResponse.redirect(new URL(next, origin));
    }

    return NextResponse.redirect(
      new URL(`/auth-error?message=${encodeURIComponent(error.message)}`, origin),
    );
  }

  return NextResponse.redirect(new URL('/auth-error', origin));
}
