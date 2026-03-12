import { NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { prisma } from '../../../lib/prisma'

export async function GET(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const boardId = searchParams.get('boardId')
  if (!boardId) return NextResponse.json({ error: 'boardId required' }, { status: 400 })

  // Verify board belongs to user
  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId: session.user.id } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = await prisma.task.findMany({
    where: { boardId },
    orderBy: { order: 'asc' },
  })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { boardId, values } = await req.json()

  // Verify board belongs to user
  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId: session.user.id } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const maxOrder = await prisma.task.aggregate({
    where: { boardId },
    _max: { order: true },
  })

  const task = await prisma.task.create({
    data: { boardId, values: values ?? {}, order: (maxOrder._max.order ?? -1) + 1 },
  })
  return NextResponse.json(task, { status: 201 })
}
