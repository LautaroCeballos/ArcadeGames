"use client"

import { useState, useEffect, useRef } from "react"

const cache = new Map<string, [string, string]>()

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")
}

function luminosity(r: number, g: number, b: number): number {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

function distance(a: number[], b: number[]): number {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return dr * dr + dg * dg + db * db
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }
  return [h * 360, s * 100, l * 100]
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360; s /= 100; l /= 100
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1
    if (t > 1) t -= 1
    if (t < 1 / 6) return p + (q - p) * 6 * t
    if (t < 1 / 2) return q
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
    return p
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s
  const p = 2 * l - q
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ]
}

function darkenForBg(r: number, g: number, b: number): [number, number, number] {
  const [h, s, l] = rgbToHsl(r, g, b)
  const darkL = Math.min(l, 35)
  return hslToRgb(h, s, darkL)
}

function extractDominantColors(imageUrl: string): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = 32
      canvas.height = 32
      const ctx = canvas.getContext("2d")!
      ctx.drawImage(img, 0, 0, 32, 32)
      const data = ctx.getImageData(0, 0, 32, 32).data

      const pixels: number[][] = []
      for (let i = 0; i < data.length; i += 4) {
        pixels.push([data[i], data[i + 1], data[i + 2]])
      }

      let centroids: number[][]

      let minLum = Infinity, maxLum = -Infinity
      let darkest = [0, 0, 0], brightest = [255, 255, 255]
      for (const p of pixels) {
        const l = luminosity(p[0], p[1], p[2])
        if (l < minLum) { minLum = l; darkest = p }
        if (l > maxLum) { maxLum = l; brightest = p }
      }
      centroids = [brightest, darkest]

      for (let iter = 0; iter < 4; iter++) {
        const sums = [[0, 0, 0], [0, 0, 0]]
        const counts = [0, 0]
        for (const p of pixels) {
          const d0 = distance(p, centroids[0])
          const d1 = distance(p, centroids[1])
          const idx = d0 < d1 ? 0 : 1
          sums[idx][0] += p[0]
          sums[idx][1] += p[1]
          sums[idx][2] += p[2]
          counts[idx]++
        }
        for (let k = 0; k < 2; k++) {
          if (counts[k] > 0) {
            centroids[k] = [
              sums[k][0] / counts[k],
              sums[k][1] / counts[k],
              sums[k][2] / counts[k],
            ]
          }
        }
      }

      centroids.sort((a, b) => luminosity(b[0], b[1], b[2]) - luminosity(a[0], a[1], a[2]))

      const darkened = centroids.map((c) => darkenForBg(c[0], c[1], c[2]))

      const result: [string, string] = [
        rgbToHex(darkened[0][0], darkened[0][1], darkened[0][2]),
        rgbToHex(darkened[1][0], darkened[1][1], darkened[1][2]),
      ]
      cache.set(imageUrl, result)
      resolve(result)
    }
    img.onerror = () => reject(new Error("Failed to load image"))
    img.src = imageUrl
  })
}

export function useDominantColors(imageUrl: string): [string, string] | null {
  const [colors, setColors] = useState<[string, string] | null>(() => {
    if (!imageUrl) return null
    const cached = cache.get(imageUrl)
    if (cached) return cached
    return null
  })
  const prevUrl = useRef(imageUrl)

  useEffect(() => {
    if (!imageUrl) {
      setColors(null)
      return
    }

    const cached = cache.get(imageUrl)
    if (cached) {
      setColors(cached)
      return
    }

    let cancelled = false
    extractDominantColors(imageUrl)
      .then((result) => {
        if (!cancelled) setColors(result)
      })
      .catch(() => {
        if (!cancelled) setColors(null)
      })

    return () => { cancelled = true }
  }, [imageUrl])

  return colors
}
