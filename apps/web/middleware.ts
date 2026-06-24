import NextAuth from 'next-auth'
import { authConfig } from '@/lib/auth.config'
import { NextResponse } from 'next/server'

const { auth } = NextAuth(authConfig)

const PUBLIC_PATHS = ['/sign-in', '/sign-up']
const AUTH_ONLY_PATHS = ['/sign-in', '/sign-up']

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth
  const isPublic = pathname === '/' || PUBLIC_PATHS.some((p) => p !== '/' && pathname.startsWith(p))
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
  matcher: ['/((?!api/auth|api/bugs/ingest|_next/static|_next/image|favicon.ico).*)'],
}
