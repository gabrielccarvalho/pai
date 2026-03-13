import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const data = await req.json()

  const column = await prisma.column.findFirst({ where: { id, board: { userId } } })
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.column.update({
    where: { id },
    data,
    include: { options: { orderBy: { order: 'asc' } } },
  })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const column = await prisma.column.findFirst({ where: { id, board: { userId } } })
  if (!column) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.column.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
