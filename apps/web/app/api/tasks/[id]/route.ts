import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '../../../../lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { values } = await req.json()

  // Verify ownership via board
  const task = await prisma.task.findFirst({
    where: { id, board: { userId: session.user.id } },
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.task.update({
    where: { id },
    data: { values },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const task = await prisma.task.findFirst({
    where: { id, board: { userId: session.user.id } },
  })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
