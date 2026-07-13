export function extractGameId(url: string): string | null {
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9\-_]+)/)
  if (idMatch) return idMatch[1]

  try {
    const parsed = new URL(url)
    const path = parsed.pathname.replace(/\/$/, "")

    if (parsed.hostname === "makecode.com") {
      const segments = path.split("/").filter(Boolean)
      if (segments.length === 1) return segments[0]
    }

    if (parsed.hostname === "arcade.makecode.com") {
      const segments = path.split("/").filter(Boolean)
      if (segments.length === 1 && !segments[0].startsWith("---")) {
        return segments[0]
      }
    }
  } catch {
    return null
  }

  return null
}

export function buildEmbedUrl(id: string): string {
  return `https://arcade.makecode.com/---run?id=${id}`
}

export function isValidMakeCodeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const { hostname, pathname, search } = parsed

    if (hostname === "arcade.makecode.com") {
      if (/[?&]id=[a-zA-Z0-9\-_]+/.test(search)) return true

      const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean)
      if (segments.length === 1 && !segments[0].startsWith("---")) return true
    }

    if (hostname === "makecode.com") {
      const segments = pathname.replace(/\/$/, "").split("/").filter(Boolean)
      if (segments.length === 1) return true
    }
  } catch {
    return false
  }

  return false
}
