import { NextResponse } from "next/server"
import { prisma } from "../../../lib/prisma"
import { requireAuth, nextOrder } from "../../../lib/api-utils"

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

export async function GET() {
  const { userId, error } = await requireAuth()
  if (error) return error

  const todos = await prisma.todo.findMany({
    where: { userId, parentId: null },
    include: {
      subTodos: {
        select: { ...subTodoSelect, subTodos: false },
        orderBy: { order: "asc" },
      },
    },
    orderBy: { order: "asc" },
  })

  return NextResponse.json(todos)
}

export async function POST(req: Request) {
  const { userId, error } = await requireAuth()
  if (error) return error

  const body = await req.json()
  const {
    title,
    description,
    dueDate,
    progress,
    eventId,
    eventCalendarId,
    eventSummary,
    parentId,
  } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 })
  }

  // Verify parent belongs to user if provided
  if (parentId) {
    const parent = await prisma.todo.findFirst({ where: { id: parentId, userId } })
    if (!parent) return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const order = await nextOrder("todo", { userId, parentId: parentId ?? null })

  const todo = await prisma.todo.create({
    data: {
      title: title.trim(),
      description: description ?? null,
      dueDate: dueDate ? new Date(dueDate) : null,
      progress: progress ?? null,
      eventId: eventId ?? null,
      eventCalendarId: eventCalendarId ?? null,
      eventSummary: eventSummary ?? null,
      parentId: parentId ?? null,
      order,
      userId,
    },
    include: {
      subTodos: {
        select: { ...subTodoSelect, subTodos: false },
        orderBy: { order: "asc" },
      },
    },
  })

  return NextResponse.json(todo, { status: 201 })
}
