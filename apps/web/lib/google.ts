import { prisma } from './prisma'

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'

/**
 * Returns a valid Google access token for the given user.
 * If the stored token is expired (or missing), it will be refreshed automatically
 * using the stored refresh_token and the result will be persisted back to the DB.
 */
export async function getGoogleAccessToken(userId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId, provider: 'google' },
    select: {
      id: true,
      access_token: true,
      refresh_token: true,
      expires_at: true,
    },
  })

  if (!account) return null

  const nowSec = Math.floor(Date.now() / 1000)
  const isExpired = account.expires_at != null && account.expires_at < nowSec + 60

  // Token is still valid
  if (account.access_token && !isExpired) {
    return account.access_token
  }

  // Attempt to refresh
  if (!account.refresh_token) return null

  const refreshed = await refreshGoogleToken(account.refresh_token)
  if (!refreshed) return null

  // Persist the new tokens
  await prisma.account.update({
    where: { id: account.id },
    data: {
      access_token: refreshed.access_token,
      expires_at: Math.floor(Date.now() / 1000) + refreshed.expires_in,
      ...(refreshed.refresh_token ? { refresh_token: refreshed.refresh_token } : {}),
    },
  })

  return refreshed.access_token
}

interface GoogleTokenResponse {
  access_token: string
  expires_in: number
  refresh_token?: string
  token_type: string
}

async function refreshGoogleToken(refreshToken: string): Promise<GoogleTokenResponse | null> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AUTH_GOOGLE_ID ?? '',
      client_secret: process.env.AUTH_GOOGLE_SECRET ?? '',
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) return null
  return res.json() as Promise<GoogleTokenResponse>
}
