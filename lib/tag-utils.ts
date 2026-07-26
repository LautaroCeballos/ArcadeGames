/**
 * Normalizes a tag name into a URL-friendly slug.
 *
 * "Acción"     → "accion"
 * "MakeCode Arcade" → "makecode-arcade"
 * "Plataformas" → "plataformas"
 */
export function slugifyTagName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove diacritics
    .replace(/\s+/g, "-")            // spaces → hyphens
    .replace(/[^a-z0-9-]/g, "")      // strip anything else
}
