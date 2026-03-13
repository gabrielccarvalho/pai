import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/api-utils'

export async function POST(req: Request) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { columnId, label, color } = await req.json()

  const column = await prisma.column.findFirst({
    where: { id: columnId, board: { userId } },
    include: { options: true },
  })
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const option = await prisma.columnOption.create({
    data: { label, color, order: column.options.length, columnId },
  })
  return NextResponse.json(option, { status: 201 })
}
