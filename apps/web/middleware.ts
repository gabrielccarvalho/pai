import { auth } from './auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthRoute = req.nextUrl.pathname.startsWith('/sign-in')
  const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth')

  if (isApiAuthRoute) return NextResponse.next()
  if (isAuthRoute) {
    if (isLoggedIn) return NextResponse.redirect(new URL('/tasks', req.nextUrl))
    return NextResponse.next()
  }
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/sign-in', req.nextUrl))
  }
  return NextResponse.next()
})

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
