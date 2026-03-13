import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { requireAuth } from '../../../../lib/api-utils'

type Params = { params: Promise<{ id: string }> }

export async function PUT(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params
  const { values } = await req.json()

  const task = await prisma.task.findFirst({ where: { id, board: { userId } } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.task.update({ where: { id }, data: { values } })
  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const task = await prisma.task.findFirst({ where: { id, board: { userId } } })
  if (!task) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  await prisma.task.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
