import { NextRequest, NextResponse } from 'next/server'
import { refreshSession } from '@nexo/core-auth'

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/signup',
  '/auth',
  '/check-email',
  '/auth-error',
  '/spoiler',
  '/terminos',
  '/privacidad',
  '/cookies',
  '/blog',
  '/precios',
  '/faq',
  '/sobre-nosotros',
  '/contacto',
  '/robots.txt',
  '/sitemap.xml',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  '/og-image.jpg',
  '/offline.html',
  '/api/health',
  '/f',
]

function isPublic(pathname: string) {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { user } = await refreshSession(request, response)
  const { pathname } = request.nextUrl

  if (isPublic(pathname)) return response

  if (!user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('next', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const onboardingComplete = user.user_metadata?.onboarding_complete === true

  if (!onboardingComplete && !pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/onboarding/cuenta', request.url))
  }

  if (onboardingComplete && pathname.startsWith('/onboarding')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
