import { Metadata } from "next"

export const metadata: Metadata = {
  title: "pai | To-Do List",
  description: "Manage your to-dos.",
}

export default function TodoPage() {
  return (
    <div className="flex h-full min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold">To-do</h1>
        <p className="mt-2 text-muted-foreground">Coming soon</p>
      </div>
    </div>
  )
}
