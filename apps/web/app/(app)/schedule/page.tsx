import { auth } from "../../../auth"
import { redirect } from "next/navigation"
import { ScheduleClient } from "../../../components/schedule/schedule-client"
import { Metadata } from "next"

export const metadata: Metadata = {
  title: "pai | Schedule",
  description: "View your Google Calendar schedule.",
}

export default async function SchedulePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/sign-in")

  return (
    <div className="flex h-full flex-col">
      <ScheduleClient />
    </div>
  )
}
