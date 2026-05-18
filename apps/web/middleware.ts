import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

// No authentication required
const PUBLIC_PATHS = ['/sign-in', '/sign-up', '/test']
// Authenticated users are redirected away from these (e.g. sign-in when already logged in)
const AUTH_ONLY_PATHS = ['/sign-in', '/sign-up']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  const isAuthOnly = AUTH_ONLY_PATHS.some((p) => pathname.startsWith(p))

  if (!isAuthenticated && !isPublic) {
    return NextResponse.redirect(new URL('/sign-in', req.url))
  }

  if (isAuthenticated && isAuthOnly) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  return NextResponse.next()
})

export const config = {
  // Exclude NextAuth API routes, ingest routes, and Next.js internals
  matcher: ['/((?!api/auth|api/ingest|_next/static|_next/image|favicon.ico).*)'],
}
