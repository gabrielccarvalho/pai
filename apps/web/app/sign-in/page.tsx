'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Button } from '@workspace/ui/components/button'

declare global {
  interface Window {
    __TAURI__?: unknown
  }
}

function SignInContent() {
  const searchParams = useSearchParams()
  const isDesktopAuth = searchParams.get('desktop') === 'true'
  const [isTauri, setIsTauri] = useState(false)

  useEffect(() => {
    setIsTauri('__TAURI__' in window)
  }, [])

  const handleSignIn = async () => {
    if (isTauri) {
      // Open system browser so passkeys and native Google auth work
      const { invoke } = await import('@tauri-apps/api/core')
      await invoke('plugin:opener|open', {
        path: 'http://localhost:3000/sign-in?desktop=true',
      })
    } else if (isDesktopAuth) {
      // Opened from the desktop app — route back through the bridge after auth
      signIn('google', { callbackUrl: '/api/auth/desktop-bridge' })
    } else {
      signIn('google', { callbackUrl: '/tasks' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-8 rounded-xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
            P
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">Personal Assistant</h1>
          <p className="text-sm text-muted-foreground">Sign in to access your workspace</p>
        </div>

        <Button type="button" className="w-full gap-2" onClick={handleSignIn}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          Continue with Google
        </Button>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInContent />
    </Suspense>
  )
}
