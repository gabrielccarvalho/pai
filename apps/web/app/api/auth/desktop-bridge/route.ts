import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createDesktopToken } from '@/lib/desktop-tokens'

// Called after Google OAuth completes in the system browser (desktop=true flow).
// Generates a short-lived one-time token and redirects to the bridge page.
export async function GET(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const token = createDesktopToken(session.user.id)
  return NextResponse.redirect(new URL(`/desktop-auth-bridge?token=${token}`, request.url))
}
