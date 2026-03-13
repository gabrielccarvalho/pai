import { NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { prisma } from '../../../../../lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function POST(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id: boardId } = await params

  // Verify board belongs to user
  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId: session.user.id } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { name, type } = await req.json()

  const maxOrder = await prisma.column.aggregate({
    where: { boardId },
    _max: { order: true },
  })

  const column = await prisma.column.create({
    data: { name, type, order: (maxOrder._max.order ?? -1) + 1, boardId },
    include: { options: true },
  })
  return NextResponse.json(column, { status: 201 })
}
