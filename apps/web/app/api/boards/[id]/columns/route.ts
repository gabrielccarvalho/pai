import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'
import { requireAuth, nextOrder } from '../../../../../lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function PATCH(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id: boardId } = await params
  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { order }: { order: { id: string; order: number }[] } = await req.json()
  await Promise.all(
    order.map(({ id, order }) => prisma.column.update({ where: { id, boardId }, data: { order } })),
  )
  return NextResponse.json({ success: true })
}

export async function POST(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id: boardId } = await params
  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, type } = await req.json()
  const order = await nextOrder('column', { boardId })
  const column = await prisma.column.create({
    data: { name, type, order, boardId },
    include: { options: true },
  })
  return NextResponse.json(column, { status: 201 })
}
