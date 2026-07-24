"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

/** Converts a hex color like #ff0000 to rgba(r,g,b,opacity) */
function hexToRgba(hex: string, opacity = 0.4): string {
  const clean = hex.replace("#", "")
  if (clean.length !== 6) return `rgba(0,0,0,${opacity})`
  const r = Number.parseInt(clean.slice(0, 2), 16)
  const g = Number.parseInt(clean.slice(2, 4), 16)
  const b = Number.parseInt(clean.slice(4, 6), 16)
  return `rgba(${r},${g},${b},${opacity})`
}

interface Slide {
  id: string
  imageUrl: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  overlayColor?: string
  textColor?: string
  buttonColor?: string
}

/** Mock slides — replace with CMS or dynamic data later */
const defaultSlides: Slide[] = [
  {
    id: "1",
    imageUrl: "",
    title: "Bienvenido a ArcadePlay",
    description: "Descubrí juegos creados con MakeCode Arcade",
    ctaText: "SABER MÁS",
    ctaLink: "/",
  },
  {
    id: "2",
    imageUrl: "",
    title: "Creá tu propio juego",
    description: "Aprendé a programar con MakeCode Arcade",
    ctaText: "EMPEZAR",
    ctaLink: "/",
  },
  {
    id: "3",
    imageUrl: "",
    title: "Compartí tus creaciones",
    description: "Publicá tus juegos y recibí feedback",
    ctaText: "SUBIR",
    ctaLink: "/subir",
  },
]

interface HeroSliderProps {
  slides?: Slide[]
}

export function HeroSlider({ slides = defaultSlides }: HeroSliderProps) {
  const [current, setCurrent] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent((prev) => (prev + 1) % slides.length)
  }, [slides.length])

  // Auto-play
  useEffect(() => {
    if (isPaused) return
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [isPaused, next])

  const slide = slides[current]

  if (slides.length === 0) return null

  return (
    <section
      className="relative overflow-hidden rounded-[10px]"
      role="region"
      aria-roledescription="carousel"
      aria-label="Juegos destacados"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Slide content */}
      <div className="relative flex aspect-[1164/308] bg-gradient-to-br from-arcade-dark to-arcade-red/80">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          /* Decorative background when no image */
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--arcade-red)_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--arcade-green)_0%,_transparent_60%)]" />
          </div>
        )}

        {/* Floating full-height panel with backdrop */}
        <div
          className="absolute z-10 backdrop-blur-sm rounded-xl
                     flex items-center justify-center
                     top-4 bottom-4 left-4 right-4
                     sm:left-auto sm:right-4"
          style={{ backgroundColor: hexToRgba(slide.overlayColor || "#000000") }}
        >
          <div className="flex flex-col items-center gap-2 px-6 py-4 sm:px-8 sm:py-5">
            <h2
              className="text-center text-xl font-bold sm:text-2xl"
              style={{ color: slide.textColor || "#ffffff" }}
            >
              {slide.title}
            </h2>
            {slide.description && (
              <p
                className="max-w-xs text-center text-sm sm:max-w-sm"
                style={{ color: slide.textColor ? `${slide.textColor}cc` : "rgba(255,255,255,0.8)" }}
              >
                {slide.description}
              </p>
            )}
            <Link
              href={slide.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center justify-center rounded-[15px] px-6 py-2 text-sm font-semibold shadow-lg transition-colors hover:brightness-110"
              style={{
                backgroundColor: slide.buttonColor || "#d90057",
                color: slide.textColor || "#ffffff",
              }}
            >
              {slide.ctaText}
            </Link>
          </div>
        </div>
      </div>

      {/* Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2" role="tablist" aria-label="Navegación de slides">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === current}
              aria-label={`Ir al slide ${i + 1}`}
              className={cn(
                "h-[18px] w-[18px] rounded-full transition-all",
                i === current
                  ? "bg-arcade-beige"
                  : "bg-arcade-beige/40 hover:bg-arcade-beige/60",
              )}
              onClick={() => setCurrent(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
