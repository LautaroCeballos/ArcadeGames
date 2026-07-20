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

/**
 * Fetches the MakeCode project info and returns the official thumbnail URL.
 * Returns null if the project can't be found or doesn't have a thumbnail.
 */
export async function fetchProjectThumbnailUrl(shortId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://arcade.makecode.com/api/${shortId}`)
    if (!res.ok) return null

    const data = await res.json()
    if (!data.thumb || !data.id) return null

    return `https://cdn.makecode.com/api/${data.id}/thumb`
  } catch {
    return null
  }
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

// ─── Scratch ───────────────────────────────────────────────

/**
 * Extracts the numeric project ID from a Scratch project URL.
 * Example: "https://scratch.mit.edu/projects/617923907" → "scratch_617923907"
 * Returns null if the URL doesn't match the expected pattern.
 */
export function extractScratchId(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== "scratch.mit.edu") return null

    const match = parsed.pathname.match(/^\/projects\/(\d+)/)
    if (!match) return null

    return `scratch_${match[1]}`
  } catch {
    return null
  }
}

/**
 * Builds the embed URL for a Scratch project.
 * The ID should already include the "scratch_" prefix (as returned by extractScratchId).
 */
export function buildScratchEmbedUrl(idOrUrl: string): string {
  // If a full URL was passed, extract the numeric ID first
  const extracted = extractScratchId(idOrUrl)
  if (extracted) {
    const numericId = extracted.replace("scratch_", "")
    return `https://scratch.mit.edu/projects/${numericId}/embed`
  }

  // If already "scratch_XXXX", extract the numeric part
  const match = idOrUrl.match(/^scratch_(\d+)$/)
  if (match) {
    return `https://scratch.mit.edu/projects/${match[1]}/embed`
  }

  // Fallback: treat as raw numeric ID
  return `https://scratch.mit.edu/projects/${idOrUrl}/embed`
}

/**
 * Validates whether a URL is a valid Scratch project URL.
 * Expected format: https://scratch.mit.edu/projects/{numeric_id}
 */
export function isValidScratchUrl(url: string): boolean {
  return extractScratchId(url) !== null
}

/**
 * Detects the game platform from a URL.
 * Returns 'makecode', 'scratch', or null if unrecognized.
 */
export function extractGamePlatform(url: string): 'makecode' | 'scratch' | null {
  if (isValidMakeCodeUrl(url)) return 'makecode'
  if (isValidScratchUrl(url)) return 'scratch'
  return null
}
