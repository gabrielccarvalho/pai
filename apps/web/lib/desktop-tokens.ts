// In-memory store for short-lived desktop auth tokens.
// Maps one-time token -> { userId, expires }
// Tokens expire in 5 minutes and are consumed on first use.

interface TokenEntry {
  userId: string
  expires: Date
}

const tokens = new Map<string, TokenEntry>()

export function createDesktopToken(userId: string): string {
  const token = crypto.randomUUID()
  tokens.set(token, {
    userId,
    expires: new Date(Date.now() + 5 * 60 * 1000),
  })
  return token
}

export function consumeDesktopToken(token: string): string | null {
  const entry = tokens.get(token)
  if (!entry) return null
  tokens.delete(token)
  if (entry.expires < new Date()) return null
  return entry.userId
}
