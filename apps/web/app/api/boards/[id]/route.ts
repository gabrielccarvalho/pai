import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const board = await prisma.taskBoard.findFirst({
    where: { id, userId },
    include: {
      columns: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(board)
}

export async function PUT(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const { name } = await req.json()
  const board = await prisma.taskBoard.updateMany({ where: { id, userId }, data: { name } })
  return NextResponse.json(board)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  await prisma.taskBoard.deleteMany({ where: { id, userId } })
  return NextResponse.json({ success: true })
}
