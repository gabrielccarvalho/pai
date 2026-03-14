import { Metadata } from "next"
import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { getOrCreateDefaultBoard } from "../../../lib/tasks"
import type { TaskBoard } from "../../../lib/types"
import { DashboardClient } from "../../../components/dashboard/dashboard-client"

export const metadata: Metadata = {
  title: "pai | Dashboard",
  description: "Your personal overview.",
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  const board = await getOrCreateDefaultBoard(session.user.id)

  return (
    <div className="flex h-full flex-col">
      <DashboardClient
        initialBoard={board as unknown as TaskBoard}
        userName={session.user.name ?? ""}
      />
    </div>
  )
}
