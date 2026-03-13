import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth } from '../../../lib/api-utils'

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  const boards = await prisma.taskBoard.findMany({
    where: { userId },
    include: { columns: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(boards)
}

export async function POST(req: Request) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { name } = await req.json()
  const board = await prisma.taskBoard.create({
    data: { name, userId },
    include: { columns: { include: { options: true } } },
  })
  return NextResponse.json(board, { status: 201 })
}
