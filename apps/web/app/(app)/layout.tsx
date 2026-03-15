import { cookies } from 'next/headers'
import { auth } from '@/auth'
import { AppSidebar } from '@/components/app-sidebar'
import { SidebarProvider, SidebarInset } from '@workspace/ui/components/sidebar'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [cookieStore, session] = await Promise.all([cookies(), auth()])
  const sidebarState = cookieStore.get('sidebar_state')?.value
  const defaultSidebarOpen = sidebarState !== 'false'
  const user = session?.user ?? { name: '', email: '' }

  return (
    <SidebarProvider defaultOpen={defaultSidebarOpen} className="min-h-0 h-[calc(100svh-2rem)] overflow-hidden">
      <AppSidebar user={{ name: user.name ?? '', email: user.email ?? '', image: 'image' in user ? user.image : undefined }} />
      <SidebarInset className="overflow-hidden">{children}</SidebarInset>
    </SidebarProvider>
  )
}
