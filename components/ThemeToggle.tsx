"use client"

import { useEffect, useState, useCallback } from "react"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

const THEME_EVENT = "themechange"

export function ThemeToggle() {
  const [dark, setDark] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setDark(document.documentElement.classList.contains("dark"))
  }, [])

  // Sync state across multiple instances (mobile + desktop)
  const handleThemeEvent = useCallback((e: Event) => {
    if (e instanceof CustomEvent && typeof e.detail?.dark === "boolean") {
      setDark(e.detail.dark)
    }
  }, [])

  useEffect(() => {
    document.addEventListener(THEME_EVENT, handleThemeEvent)
    return () => document.removeEventListener(THEME_EVENT, handleThemeEvent)
  }, [handleThemeEvent])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle("dark", next)
    try {
      localStorage.setItem("theme", next ? "dark" : "light")
    } catch (_) {}
    // Notify other ThemeToggle instances
    document.dispatchEvent(new CustomEvent(THEME_EVENT, { detail: { dark: next } }))
  }

  if (!mounted) {
    return <div className="h-9 w-9" />
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className="text-foreground hover:bg-accent/80"
      aria-label={dark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
    >
      {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  )
}
