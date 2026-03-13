import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { TaskBoardClient } from "../../../components/tasks/task-board"
import { getOrCreateDefaultBoard } from "../../../lib/tasks"
import type { TaskBoard } from "../../../lib/types"

export default async function TasksPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const board = await getOrCreateDefaultBoard(session.user.id)

  return (
    <div className="flex h-full flex-col">
      <TaskBoardClient initialBoard={board as unknown as TaskBoard} />
    </div>
  )
}
