import { NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { prisma } from '../../../../lib/prisma'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const data = await req.json()

  const option = await prisma.columnOption.findFirst({
    where: { id, column: { board: { userId: session.user.id } } },
  })
  if (!option) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.columnOption.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params

  const option = await prisma.columnOption.findFirst({
    where: { id, column: { board: { userId: session.user.id } } },
  })
  if (!option) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.columnOption.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
