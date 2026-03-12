import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '../../../../lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const board = await prisma.taskBoard.findFirst({
    where: { id, userId: session.user.id },
    include: {
      columns: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } },
      tasks: { orderBy: { order: 'asc' } },
    },
  })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(board)
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { name } = await req.json()
  const board = await prisma.taskBoard.updateMany({
    where: { id, userId: session.user.id },
    data: { name },
  })
  return NextResponse.json(board)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  await prisma.taskBoard.deleteMany({ where: { id, userId: session.user.id } })
  return NextResponse.json({ success: true })
}
