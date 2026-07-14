"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface Slide {
  id: string
  imageUrl: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
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
      <div className="relative flex aspect-[1164/308] items-center justify-center bg-gradient-to-br from-arcade-dark to-arcade-red/80">
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

        {/* Text overlay */}
        <div className="relative z-10 flex flex-col items-center gap-4 px-6 text-center">
          <h2 className="text-2xl font-bold text-arcade-beige sm:text-3xl">
            {slide.title}
          </h2>
          {slide.description && (
            <p className="max-w-md text-sm text-arcade-beige/80">
              {slide.description}
            </p>
          )}
          <Link
            href={slide.ctaLink}
            className="inline-flex items-center justify-center rounded-[15px] bg-arcade-red px-6 py-2.5 text-sm font-semibold text-arcade-beige transition-colors hover:bg-arcade-red/90"
          >
            {slide.ctaText}
          </Link>
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
