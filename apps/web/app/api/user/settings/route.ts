import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/api-utils"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { settings: true },
  })

  return NextResponse.json(user?.settings ?? {})
}

export async function PATCH(req: NextRequest) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const body = await req.json()

  const user = await prisma.user.update({
    where: { id: userId },
    data: { settings: body },
    select: { settings: true },
  })

  return NextResponse.json(user.settings)
}
