/**
 * Maps tag names to category colors.
 * Each entry provides CSS color values for:
 * - `bg`:   light background (10% opacity) for icon circles
 * - `icon`: main color for the icon
 * - `badge`: solid background for badge pills
 * - `text`: readable text color on badge (usually white)
 */

export interface TagColor {
  bg: string
  icon: string
  badge: string
  badgeBorder: string
}

const colorMap: Record<string, TagColor> = {
  // ── Platform tags ──────────────────────────────────────────
  "MakeCode Arcade": {
    bg: "rgba(247,104,32,0.10)",
    icon: "#F76820",
    badge: "#F76820",
    badgeBorder: "#F76820",
  },
  Scratch: {
    bg: "rgba(249,168,58,0.10)",
    icon: "#F9A83A",
    badge: "#F9A83A",
    badgeBorder: "#F9A83A",
  },

  // ── Category tags ──────────────────────────────────────────
  Acción: {
    bg: "rgba(244,63,94,0.10)",
    icon: "#f43f5e",
    badge: "#f43f5e",
    badgeBorder: "#fda4af",
  },
  Aventura: {
    bg: "rgba(245,158,11,0.10)",
    icon: "#f59e0b",
    badge: "#f59e0b",
    badgeBorder: "#fcd34d",
  },
  Puzzle: {
    bg: "rgba(139,92,246,0.10)",
    icon: "#8b5cf6",
    badge: "#8b5cf6",
    badgeBorder: "#c4b5fd",
  },
  Plataformas: {
    bg: "rgba(6,182,212,0.10)",
    icon: "#06b6d4",
    badge: "#06b6d4",
    badgeBorder: "#67e8f9",
  },
  Carreras: {
    bg: "rgba(249,115,22,0.10)",
    icon: "#f97316",
    badge: "#f97316",
    badgeBorder: "#fdba74",
  },
  Deportes: {
    bg: "rgba(59,130,246,0.10)",
    icon: "#3b82f6",
    badge: "#3b82f6",
    badgeBorder: "#93c5fd",
  },
  Estrategia: {
    bg: "rgba(99,102,241,0.10)",
    icon: "#6366f1",
    badge: "#6366f1",
    badgeBorder: "#a5b4fc",
  },
  Arcade: {
    bg: "rgba(217,70,239,0.10)",
    icon: "#d946ef",
    badge: "#d946ef",
    badgeBorder: "#f0abfc",
  },
  Disparos: {
    bg: "rgba(239,68,68,0.10)",
    icon: "#ef4444",
    badge: "#ef4444",
    badgeBorder: "#fca5a5",
  },
  Multijugador: {
    bg: "rgba(100,116,139,0.10)",
    icon: "#64748b",
    badge: "#64748b",
    badgeBorder: "#cbd5e1",
  },
  RPG: {
    bg: "rgba(168,85,247,0.10)",
    icon: "#a855f7",
    badge: "#a855f7",
    badgeBorder: "#d8b4fe",
  },
  Simulación: {
    bg: "rgba(14,165,233,0.10)",
    icon: "#0ea5e9",
    badge: "#0ea5e9",
    badgeBorder: "#7dd3fc",
  },
  Música: {
    bg: "rgba(236,72,153,0.10)",
    icon: "#ec4899",
    badge: "#ec4899",
    badgeBorder: "#f9a8d4",
  },
  Terror: {
    bg: "rgba(82,82,91,0.10)",
    icon: "#52525b",
    badge: "#52525b",
    badgeBorder: "#a1a1aa",
  },
  Supervivencia: {
    bg: "rgba(34,197,94,0.10)",
    icon: "#22c55e",
    badge: "#22c55e",
    badgeBorder: "#86efac",
  },
  Educativo: {
    bg: "rgba(234,179,8,0.10)",
    icon: "#eab308",
    badge: "#eab308",
    badgeBorder: "#fde047",
  },
  Laberinto: {
    bg: "rgba(120,113,108,0.10)",
    icon: "#78716c",
    badge: "#78716c",
    badgeBorder: "#d6d3d1",
  },
  Creativo: {
    bg: "rgba(16,185,129,0.10)",
    icon: "#10b981",
    badge: "#10b981",
    badgeBorder: "#6ee7b7",
  },
}

/**
 * Returns the TagColor for a given tag name.
 * Falls back to a neutral gray if the tag is not in the mapping.
 */
export function getTagColor(tagName: string): TagColor {
  return (
    colorMap[tagName] ?? {
      bg: "rgba(113,113,122,0.10)",
      icon: "#71717a",
      badge: "#71717a",
      badgeBorder: "#d4d4d8",
    }
  )
}
