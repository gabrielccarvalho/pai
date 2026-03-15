import { NextResponse } from 'next/server'
import { encode } from 'next-auth/jwt'
import { consumeDesktopToken } from '@/lib/desktop-tokens'

// Receives the one-time token via deep link (pai://auth?token=XXX),
// validates it, mints a new session JWT, and sets it as a cookie in the webview.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const userId = consumeDesktopToken(token)
  if (!userId) {
    return NextResponse.redirect(new URL('/sign-in?error=expired', request.url))
  }

  const isProduction = process.env.NODE_ENV === 'production'
  const cookieName = isProduction ? '__Secure-authjs.session-token' : 'authjs.session-token'

  const jwt = await encode({
    token: { sub: userId, id: userId },
    secret: process.env.AUTH_SECRET!,
    salt: cookieName,
  })

  const response = NextResponse.redirect(new URL('/tasks', request.url))
  response.cookies.set(cookieName, jwt, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    path: '/',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  return response
}
