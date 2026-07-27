"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { useDominantColors } from "@/hooks/use-dominant-colors"

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
      <div className="grid grid-cols-1 grid-rows-1">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "col-span-full row-span-full transition-all duration-500 ease-in-out",
              i === current ? "opacity-100" : "opacity-0 pointer-events-none",
            )}
          >
            {s.template === "full-image" ? (
              <FullImageSlide slide={s} />
            ) : (
              <BarSlide slide={s} />
            )}
          </div>
        ))}
      </div>

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
      <div className="relative flex aspect-[3/1] bg-gradient-to-br from-arcade-dark to-arcade-red/80">
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
  const dominantColors = useDominantColors(slide.imageUrl)
  const bgStyle = dominantColors
    ? { background: `linear-gradient(135deg, ${dominantColors[0]}, ${dominantColors[1]})` }
    : undefined

  const hasContent = !!(slide.title || slide.description || slide.ctaText)
  const imageWidth = hasContent ? "md:w-[75%]" : "md:w-full"

  return (
    <div className={cn(
      "flex flex-col md:aspect-[3/1] md:flex-row",
    )}>
      {/* Content panel — only when there's something to show */}
      {hasContent && (
        <div
          style={bgStyle}
          className={cn(
            "flex flex-col items-center justify-center gap-3 p-6 text-center md:w-[25%] md:p-8 lg:gap-4",
            !dominantColors && "bg-gradient-to-br from-arcade-dark to-arcade-red/80",
            isLeft ? "md:order-2" : "md:order-1",
          )}
        >
          {slide.title && (
            <h2 className="text-xl font-bold text-white sm:text-2xl md:text-3xl">
              {slide.title}
            </h2>
          )}
          {slide.description && (
            <p className="text-sm text-white/80 sm:text-base">
              {slide.description}
            </p>
          )}
          {slide.ctaText && (
            <Link
              href={slide.ctaLink}
              target="_blank"
              rel="noopener noreferrer"
              className="relative inline-flex items-center justify-center rounded-[10px] bg-primary px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl sm:px-6 sm:py-2.5 sm:text-base"
            >
              <span className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
              <span className="relative">{slide.ctaText}</span>
            </Link>
          )}
        </div>
      )}

      {/* Image */}
      <div className={cn(
        "relative aspect-video w-full md:aspect-auto",
        imageWidth,
        isLeft ? "md:order-1" : hasContent ? "md:order-2" : "md:order-1",
        !hasContent && "flex items-center justify-center bg-gradient-to-br from-arcade-dark to-arcade-red/80",
      )}>
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            className={hasContent
              ? "absolute inset-0 h-full w-full object-cover"
              : "max-h-full max-w-full object-contain"
            }
          />
        ) : (
          <div className="absolute inset-0 opacity-10">
            <div className="h-full w-full bg-[radial-gradient(ellipse_at_top_right,_var(--arcade-red)_0%,_transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--arcade-green)_0%,_transparent_60%)]" />
          </div>
        )}
      </div>
    </div>
  )
}
