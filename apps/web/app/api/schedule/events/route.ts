import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '../../../../lib/api-utils'
import { getGoogleAccessToken } from '../../../../lib/google'

interface GoogleCalendarEventRaw {
  id: string
  summary?: string
  description?: string
  location?: string
  start?: { dateTime?: string; date?: string; timeZone?: string }
  end?: { dateTime?: string; date?: string; timeZone?: string }
  colorId?: string
  htmlLink?: string
  attendees?: Array<{ self?: boolean; responseStatus?: string }>
}

async function fetchCalendarEvents(
  calendarId: string,
  timeMin: string,
  timeMax: string,
  accessToken: string
): Promise<object[]> {
  const url = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
  )
  url.searchParams.set('timeMin', timeMin)
  url.searchParams.set('timeMax', timeMax)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')
  url.searchParams.set('maxResults', '250')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (!res.ok) return []

  const data = await res.json()

  return (data.items ?? []).map((item: GoogleCalendarEventRaw) => ({
    id: `${calendarId}::${item.id}`,
    summary: item.summary ?? '(No title)',
    description: item.description ?? null,
    location: item.location ?? null,
    start: item.start,
    end: item.end,
    colorId: item.colorId ?? null,
    htmlLink: item.htmlLink ?? null,
    allDay: Boolean(item.start?.date && !item.start?.dateTime),
    selfResponseStatus: item.attendees?.find((a) => a.self)?.responseStatus ?? 'accepted',
    calendarId,
  }))
}

export async function GET(req: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { searchParams } = new URL(req.url)
  const timeMin = searchParams.get('timeMin')
  const timeMax = searchParams.get('timeMax')
  const calendarIdsParam = searchParams.get('calendarIds')

  if (!timeMin || !timeMax) {
    return NextResponse.json({ error: 'timeMin and timeMax are required' }, { status: 400 })
  }

  const accessToken = await getGoogleAccessToken(userId)
  if (!accessToken) {
    return NextResponse.json({ error: 'no_token', message: 'Google account not connected' }, { status: 401 })
  }

  const calendarIds = calendarIdsParam
    ? calendarIdsParam.split(',').filter(Boolean)
    : ['primary']

  // Verify token is valid with a quick single-calendar check
  const testUrl = new URL(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarIds[0] ?? 'primary')}/events`
  )
  testUrl.searchParams.set('timeMin', timeMin)
  testUrl.searchParams.set('timeMax', timeMax)
  testUrl.searchParams.set('singleEvents', 'true')
  testUrl.searchParams.set('maxResults', '1')

  const testRes = await fetch(testUrl.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  })

  if (testRes.status === 401) {
    return NextResponse.json({ error: 'token_expired', message: 'Google token expired. Please sign in again.' }, { status: 401 })
  }

  // Fetch from all calendars in parallel
  const allEvents = await Promise.all(
    calendarIds.map((calId) => fetchCalendarEvents(calId, timeMin, timeMax, accessToken))
  )

  return NextResponse.json(allEvents.flat())
}
