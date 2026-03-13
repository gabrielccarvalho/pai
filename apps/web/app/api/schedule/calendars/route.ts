import { NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { getGoogleAccessToken } from '../../../../lib/google'

interface GoogleCalendarListItem {
  id: string
  summary?: string
  backgroundColor?: string
  foregroundColor?: string
  selected?: boolean
  primary?: boolean
  accessRole?: string
}

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  const accessToken = await getGoogleAccessToken(userId)
  if (!accessToken) {
    return NextResponse.json({ error: 'no_token', message: 'Google account not connected' }, { status: 401 })
  }

  const res = await fetch(
    'https://www.googleapis.com/calendar/v3/users/me/calendarList?maxResults=250',
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (res.status === 401) {
    return NextResponse.json({ error: 'token_expired', message: 'Google token expired. Please sign in again.' }, { status: 401 })
  }

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ error: 'google_api_error', message: body }, { status: 502 })
  }

  const data = await res.json()

  const calendars = (data.items ?? []).map((item: GoogleCalendarListItem) => ({
    id: item.id,
    summary: item.summary ?? item.id,
    backgroundColor: item.backgroundColor ?? '#4285f4',
    foregroundColor: item.foregroundColor ?? '#ffffff',
    selected: item.selected ?? true,
    primary: item.primary ?? false,
  }))

  return NextResponse.json(calendars)
}
