"use client"

import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <h1 className="text-4xl font-bold">Error</h1>
      <p className="text-muted-foreground">Algo salió mal</p>
      <Button onClick={reset}>Intentar de nuevo</Button>
    </div>
  )
}
