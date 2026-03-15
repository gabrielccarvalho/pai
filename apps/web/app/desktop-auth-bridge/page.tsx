'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import { Button } from '@workspace/ui/components/button'

function BridgeContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const deepLink = token ? `pai://auth?token=${token}` : null

  useEffect(() => {
    if (!deepLink) return
    // Try to auto-open the app after a short delay
    const t = setTimeout(() => {
      window.location.href = deepLink
    }, 800)
    return () => clearTimeout(t)
  }, [deepLink])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-xl border border-border bg-card p-8 shadow-sm text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-xl font-bold">
          P
        </div>
        <div className="flex flex-col gap-2">
          <h1 className="text-xl font-semibold">You&apos;re signed in!</h1>
          <p className="text-sm text-muted-foreground">
            Return to the pai desktop app to continue.
          </p>
        </div>
        <Button
          className="w-full"
          disabled={!deepLink}
          onClick={() => {
            if (deepLink) window.location.href = deepLink
          }}
        >
          Open in pai
        </Button>
      </div>
    </div>
  )
}

export default function DesktopAuthBridgePage() {
  return (
    <Suspense>
      <BridgeContent />
    </Suspense>
  )
}
