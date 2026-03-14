import { Metadata } from "next"
import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { TodoClient } from "../../../components/todo/todo-client"

export const metadata: Metadata = {
  title: "pai | To-Do List",
  description: "Manage your to-dos.",
}

export default async function TodoPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  return (
    <div className="flex h-full flex-col">
      <TodoClient />
    </div>
  )
}
