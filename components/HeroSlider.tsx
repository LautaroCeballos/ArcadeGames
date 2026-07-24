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
  template?: string
}

const defaultSlides: Slide[] = [
  {
    id: "1",
    imageUrl: "",
    title: "Bienvenido a ArcadePlay",
    description: "Descubrí juegos creados con MakeCode Arcade",
    ctaText: "SABER MÁS",
    ctaLink: "/",
    template: "bar-right",
  },
  {
    id: "2",
    imageUrl: "",
    title: "Creá tu propio juego",
    description: "Aprendé a programar con MakeCode Arcade",
    ctaText: "EMPEZAR",
    ctaLink: "/",
    template: "bar-right",
  },
  {
    id: "3",
    imageUrl: "",
    title: "Compartí tus creaciones",
    description: "Publicá tus juegos y recibí feedback",
    ctaText: "SUBIR",
    ctaLink: "/subir",
    template: "bar-right",
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
      {slide.template === "full-image" ? (
        <FullImageSlide slide={slide} />
      ) : (
        <BarSlide slide={slide} />
      )}

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

function FullImageSlide({ slide }: { slide: Slide }) {
  return (
    <Link
      href={slide.ctaLink}
      target="_blank"
      rel="noopener noreferrer"
      className="block"
    >
      <div className="relative flex h-[250px] sm:h-[320px] md:h-[360px] lg:h-[400px] bg-gradient-to-br from-arcade-dark to-arcade-red/80">
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--arcade-red)_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--arcade-green)_0%,_transparent_60%)]" />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
      </div>
    </Link>
  )
}

function BarSlide({ slide }: { slide: Slide }) {
  const isLeft = slide.template === "bar-left"

  return (
    <div className="relative flex h-[250px] sm:h-[320px] md:h-[360px] lg:h-[400px] bg-gradient-to-br from-arcade-dark to-arcade-red/80">
      {slide.imageUrl ? (
        <img
          src={slide.imageUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--arcade-red)_0%,_transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--arcade-green)_0%,_transparent_60%)]" />
        </div>
      )}

      {/* Glass bar */}
      <div
        className={cn(
          "absolute z-10 backdrop-blur-sm bg-black/60 flex items-center justify-center gap-2 p-4",
          // Desktop: vertical bar on the side
          isLeft ? "left-0 inset-y-0 w-1/6" : "right-0 inset-y-0 w-1/6",
          // Mobile: horizontal bar at the bottom
          "max-md:inset-x-0 max-md:bottom-0 max-md:w-full max-md:h-auto max-md:flex-row max-md:p-3",
        )}
      >
        <div className={cn(
          "flex flex-col items-center gap-2",
          "max-md:flex-1 max-md:items-start",
        )}>
          <h2
            className="text-center text-xs font-bold leading-tight text-white sm:text-sm"
          >
            {slide.title}
          </h2>
          {slide.description && (
            <p className="max-w-[120px] text-center text-[10px] leading-tight text-white/80 sm:max-w-[160px] sm:text-xs max-md:max-w-none max-md:text-left">
              {slide.description}
            </p>
          )}
        </div>
        <Link
          href={slide.ctaLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-[10px] bg-arcade-red px-3 py-1.5 text-[10px] font-semibold text-white shadow-lg transition-colors hover:brightness-110 sm:rounded-[12px] sm:px-4 sm:py-2 sm:text-xs shrink-0"
        >
          {slide.ctaText}
        </Link>
      </div>
    </div>
  )
}
