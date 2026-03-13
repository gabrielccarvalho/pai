import { auth } from "../../../auth"
import { prisma } from "../../../lib/prisma"
import { TaskBoardClient } from "../../../components/tasks/task-board"
import { redirect } from "next/navigation"
import type { TaskBoard } from "../../../lib/types"

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  // Get or auto-create the default board for this user
  let board = await prisma.taskBoard.findFirst({
    where: { userId: session.user.id },
    include: {
      columns: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      tasks: { orderBy: { order: "asc" } },
    },
    orderBy: { createdAt: "asc" },
  })

  if (!board) {
    // Create default board with default columns
    board = await createDefaultBoard(session.user.id)
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col">
      <TaskBoardClient initialBoard={board as unknown as TaskBoard} />
    </div>
  )
}

async function createDefaultBoard(userId: string) {
  const statusOptions = [
    { label: "Todo", color: "#6b7280", order: 0 },
    { label: "In Progress", color: "#3b82f6", order: 1 },
    { label: "Done", color: "#22c55e", order: 2 },
  ]

  const priorityOptions = [
    { label: "Low", color: "#22c55e", order: 0 },
    { label: "Medium", color: "#f97316", order: 1 },
    { label: "High", color: "#ef4444", order: 2 },
  ]

  return prisma.taskBoard.create({
    data: {
      name: "My Tasks",
      userId,
      columns: {
        create: [
          {
            name: "Company",
            type: "select",
            order: 0,
            options: { create: [] },
          },
          { name: "Title", type: "text", order: 1, options: { create: [] } },
          {
            name: "Status",
            type: "select",
            order: 2,
            options: { create: statusOptions },
          },
          { name: "Due date", type: "date", order: 3, options: { create: [] } },
          {
            name: "Priority",
            type: "select",
            order: 4,
            options: { create: priorityOptions },
          },
        ],
      },
    },
    include: {
      columns: {
        include: { options: { orderBy: { order: "asc" } } },
        orderBy: { order: "asc" },
      },
      tasks: { orderBy: { order: "asc" } },
    },
  })
}
