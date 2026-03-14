import { NextResponse } from "next/server"
import { auth } from "../auth"
import { prisma } from "./prisma"

// ── Auth ──────────────────────────────────────────────────────────────────────

type AuthSuccess = { userId: string; error: null }
type AuthFailure = { userId: null; error: NextResponse }

/**
 * Validates the session and returns the userId, or an error response.
 *
 * Usage:
 *   const { userId, error } = await requireAuth()
 *   if (error) return error
 */
export async function requireAuth(): Promise<AuthSuccess | AuthFailure> {
  const session = await auth()
  if (!session?.user?.id) {
    return {
      userId: null,
      error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    }
  }
  return { userId: session.user.id, error: null }
}

// ── Order ─────────────────────────────────────────────────────────────────────

/**
 * Returns the next order value for a model that has an `order` field.
 * Queries the max current order and returns max + 1 (or 0 if none exist).
 */
type OrderedDelegate = {
  aggregate(args: {
    where: Record<string, unknown>
    _max: { order: true }
  }): Promise<{ _max: { order: number | null } }>
}

export async function nextOrder(
  model: "task" | "column" | "columnOption" | "todo",
  where: Record<string, unknown>
): Promise<number> {
  const delegate = prisma[model] as unknown as OrderedDelegate
  const result = await delegate.aggregate({ where, _max: { order: true } })
  return (result._max.order ?? -1) + 1
}
