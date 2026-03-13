import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const data = await req.json()

  const option = await prisma.columnOption.findFirst({
    where: { id, column: { board: { userId } } },
  })
  if (!option) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.columnOption.update({ where: { id }, data })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const option = await prisma.columnOption.findFirst({
    where: { id, column: { board: { userId } } },
  })
  if (!option) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.columnOption.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
