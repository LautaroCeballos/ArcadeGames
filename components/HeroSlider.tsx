"use client"

import { useState, useEffect, useCallback, useRef } from "react"
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
  duration?: number
  clickable?: boolean
  openInNewTab?: boolean
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
  const animatingRef = useRef(false)

  /* Navigate to a specific slide — blocks during fade animation */
  const goTo = useCallback((index: number) => {
    if (animatingRef.current) return
    animatingRef.current = true
    setCurrent(index)
  }, [])

  const next = useCallback(() => {
    goTo((current + 1) % slides.length)
  }, [current, slides.length, goTo])

  /* Release animation lock after fade transition completes */
  useEffect(() => {
    const timer = setTimeout(() => {
      animatingRef.current = false
    }, 550)
    return () => clearTimeout(timer)
  }, [current])

  /* Auto-play: slide duration + 0.5s fade transition between slides */
  useEffect(() => {
    if (isPaused) return
    const dur = slides[current]?.duration ?? 5
    const timer = setTimeout(next, (dur + 0.5) * 1000)
    return () => clearTimeout(timer)
  }, [isPaused, current, next, slides])

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
        {slides.map((s, i) => {
          const isActive = i === current
          return (
            <div
              key={s.id}
              className={cn(
                "col-span-full row-span-full transition-opacity duration-500 ease-in-out",
                isActive ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
              aria-hidden={!isActive}
            >
              {s.template === "full-image" ? (
                <FullImageSlide slide={s} isActive={isActive} />
              ) : (
                <BarSlide slide={s} isActive={isActive} />
              )}
            </div>
          )
        })}
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
              onClick={() => goTo(i)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function FullImageSlide({ slide, isActive }: { slide: Slide; isActive?: boolean }) {
  const isClickable = slide.clickable !== false
  const newTab = slide.openInNewTab !== false
  const dur = slide.duration ?? 5
  const imgRef = useRef<HTMLImageElement>(null)
  const [restart, setRestart] = useState(0)

  useEffect(() => {
    if (isActive && imgRef.current) {
      imgRef.current.animate(
        [
          { objectPosition: "0% 50%" },
          { objectPosition: "100% 50%" },
        ],
        {
          duration: dur * 1000,
          easing: "ease-in-out",
          fill: "forwards",
        }
      )
    }
  }, [isActive, dur])

  const image = (
    <div className="relative flex h-[420px] w-full md:h-auto md:aspect-[3/1] bg-gradient-to-br from-arcade-dark to-arcade-red/80">
      {slide.imageUrl ? (
        <img
          ref={imgRef}
          src={slide.imageUrl}
          alt=""
          key={`fi-${slide.id}`}
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
  )

  if (!isClickable) {
    return <div>{image}</div>
  }

  return (
    <Link
      href={slide.ctaLink}
      target={newTab ? "_blank" : undefined}
      rel={newTab ? "noopener noreferrer" : undefined}
      className="block"
    >
      {image}
    </Link>
  )
}

function BarSlide({ slide, isActive }: { slide: Slide; isActive?: boolean }) {
  const isLeft = slide.template === "bar-left"
  const openInNewTab = slide.openInNewTab !== false
  const dur = slide.duration ?? 5
  const dominantColors = useDominantColors(slide.imageUrl)
  const bgStyle = dominantColors
    ? { background: `linear-gradient(135deg, ${dominantColors[0]}, ${dominantColors[1]})` }
    : undefined

  const hasContent = !!(slide.title || slide.description || slide.ctaText)
  const imageWidth = hasContent ? "md:w-[75%]" : "md:w-full"

  /* Props for CTA links — respect openInNewTab from DB */
  const linkProps = {
    href: slide.ctaLink,
    target: openInNewTab ? "_blank" as const : undefined,
    rel: openInNewTab ? "noopener noreferrer" as const : undefined,
  }

  return (
    <div className={cn(
      "flex h-[420px] flex-col md:h-auto md:aspect-[3/1] md:flex-row",
    )}>
      {/* Content panel — hidden on mobile, visible on desktop */}
      {hasContent && (
        <div
          style={bgStyle}
          className={cn(
            "hidden md:flex flex-col items-center justify-center gap-3 p-8 text-center md:w-[25%] lg:gap-4 transition-all duration-700",
            !dominantColors && "bg-gradient-to-br from-arcade-dark to-arcade-red/80",
            isLeft ? "md:order-2" : "md:order-1",
          )}
        >
          {slide.title && (
            <h2 className="text-xl font-bold text-white md:text-3xl">
              {slide.title}
            </h2>
          )}
          {slide.description && (
            <p className="line-clamp-3 text-sm text-white/80 md:text-base">
              {slide.description}
            </p>
          )}
          {slide.ctaText && (
            <Link
              {...linkProps}
              className="relative inline-flex shrink-0 items-center justify-center rounded-[10px] bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:brightness-110 hover:shadow-xl md:text-base"
            >
              <span className="absolute inset-0 rounded-[10px] bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />
              <span className="relative">{slide.ctaText}</span>
            </Link>
          )}
        </div>
      )}

      {/* Image — full height on mobile (link overlay), fixed width % on desktop */}
      <div className={cn(
        "relative w-full flex-1 overflow-hidden md:flex-none md:aspect-auto",
        imageWidth,
        isLeft ? "md:order-1" : hasContent ? "md:order-2" : "md:order-1",
        !hasContent && "flex items-center justify-center bg-gradient-to-br from-arcade-dark to-arcade-red/80",
      )}>
        {/* Mobile: invisible link covering the whole image (only when slide has content) */}
        {hasContent && (
          <Link
            {...linkProps}
            className="absolute inset-0 z-10 md:hidden"
            aria-label={slide.title || slide.ctaText}
          />
        )}
        {slide.imageUrl ? (
          <img
            src={slide.imageUrl}
            alt=""
            key={`bs-${slide.id}`}
            className={cn(
              hasContent
                ? "absolute inset-0 h-full w-full object-cover"
                : "max-h-full max-w-full object-contain",
              hasContent && isActive && "animate-ken-burns",
            )}
            style={hasContent && isActive ? { animationDuration: `${dur}s` } : undefined}
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
