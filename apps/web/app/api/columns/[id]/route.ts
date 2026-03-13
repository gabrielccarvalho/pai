import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '../../../../lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json()

  // Verify ownership via board
  const column = await prisma.column.findFirst({
    where: { id, board: { userId: session.user.id } },
  })
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.column.update({
    where: { id },
    data,
    include: { options: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  // Verify ownership via board
  const column = await prisma.column.findFirst({
    where: { id, board: { userId: session.user.id } },
  })
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.column.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
