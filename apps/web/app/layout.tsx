import type { Metadata } from "next"
import { Geist_Mono, Figtree } from "next/font/google"

export const metadata: Metadata = {
  title: "pai",
  description: "Your personal AI assistant.",
}

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { Toaster } from "@workspace/ui/components/sonner"

const figtree = Figtree({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        figtree.variable
      )}
    >
      <body className="pt-8">
        <div data-tauri-drag-region className="fixed top-0 left-0 right-0 h-8 z-50 bg-background" />
        <ThemeProvider>
          <TooltipProvider>
            <Toaster />
            {children}
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
