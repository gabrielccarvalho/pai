import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { requireAuth, nextOrder } from '../../../lib/api-utils'

export async function GET(req: Request) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const boardId = new URL(req.url).searchParams.get('boardId')
  if (!boardId) return NextResponse.json({ error: 'boardId required' }, { status: 400 })

  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const tasks = await prisma.task.findMany({ where: { boardId }, orderBy: { order: 'asc' } })
  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { boardId, values } = await req.json()

  const board = await prisma.taskBoard.findFirst({ where: { id: boardId, userId } })
  if (!board) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const order = await nextOrder('task', { boardId })
  const task = await prisma.task.create({ data: { boardId, values: values ?? {}, order } })
  return NextResponse.json(task, { status: 201 })
}
