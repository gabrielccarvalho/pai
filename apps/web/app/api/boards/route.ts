import { NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { prisma } from '../../../lib/prisma'

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const boards = await prisma.taskBoard.findMany({
    where: { userId: session.user.id },
    include: { columns: { include: { options: { orderBy: { order: 'asc' } } }, orderBy: { order: 'asc' } } },
    orderBy: { createdAt: 'asc' },
  })
  return NextResponse.json(boards)
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { name } = await req.json()
  const board = await prisma.taskBoard.create({
    data: { name, userId: session.user.id },
    include: { columns: { include: { options: true } } },
  })
  return NextResponse.json(board, { status: 201 })
}
