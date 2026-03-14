import { NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"
import { requireAuth } from "../../../../lib/api-utils"

type Params = { params: Promise<{ id: string }> }

const subTodoSelect = {
  id: true,
  title: true,
  description: true,
  completed: true,
  dueDate: true,
  progress: true,
  eventId: true,
  eventCalendarId: true,
  eventSummary: true,
  order: true,
  parentId: true,
  createdAt: true,
  updatedAt: true,
}

export async function PUT(req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const todo = await prisma.todo.findFirst({ where: { id, userId } })
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const body = await req.json()
  const {
    title,
    description,
    completed,
    dueDate,
    progress,
    eventId,
    eventCalendarId,
    eventSummary,
  } = body

  const updated = await prisma.todo.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(description !== undefined && { description }),
      ...(completed !== undefined && { completed }),
      ...(dueDate !== undefined && { dueDate: dueDate ? new Date(dueDate) : null }),
      ...(progress !== undefined && { progress }),
      ...(eventId !== undefined && { eventId }),
      ...(eventCalendarId !== undefined && { eventCalendarId }),
      ...(eventSummary !== undefined && { eventSummary }),
    },
    include: {
      subTodos: {
        select: { ...subTodoSelect, subTodos: false },
        orderBy: { order: "asc" },
      },
    },
  })

  return NextResponse.json(updated)
}

export async function DELETE(_req: Request, { params }: Params) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const { id } = await params

  const todo = await prisma.todo.findFirst({ where: { id, userId } })
  if (!todo) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.todo.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
