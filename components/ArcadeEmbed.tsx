"use client"

import { useState } from "react"
import { cn } from "@/lib/utils"

interface ArcadeEmbedProps {
  url: string
  title: string
}

export function ArcadeEmbed({ url, title }: ArcadeEmbedProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  return (
    <div className="relative w-full aspect-[4/3] bg-muted rounded-lg overflow-hidden">
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
          <span className="text-3xl">⚠️</span>
          <p className="text-sm">No se pudo cargar el juego</p>
          <p className="text-xs">El juego puede haber sido removido de MakeCode</p>
        </div>
      ) : (
        <iframe
          src={url}
          title={title}
          className={cn(
            "w-full h-full border-0 transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          allow="fullscreen"
          onLoad={() => setLoaded(true)}
          onError={() => {
            setError(true)
            setLoaded(true)
          }}
        />
      )}
    </div>
  )
}
