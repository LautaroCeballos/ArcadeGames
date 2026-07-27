/**
 * Maps tag names to Lucide icon names.
 * Falls back to Gamepad2 for unrecognised tags.
 */

import {
  Gamepad2,
  Swords,
  Compass,
  Puzzle,
  LayoutGrid,
  Car,
  Trophy,
  BrainCircuit,
  Joystick,
  Crosshair,
  Users,
  Code2,
  Cat,
  Sword,
  Cpu,
  Music,
  Ghost,
  Shield,
  BookOpen,
  Palette,
  Map,
  type LucideIcon,
} from "lucide-react"

const iconMap: Record<string, LucideIcon> = {
  // Platform tags
  "MakeCode Arcade": Code2,
  Scratch: Cat,

  // Category tags
  Acción: Swords,
  Aventura: Compass,
  Puzzle: Puzzle,
  Plataformas: LayoutGrid,
  Carreras: Car,
  Deportes: Trophy,
  Estrategia: BrainCircuit,
  Arcade: Joystick,
  Disparos: Crosshair,
  Multijugador: Users,
  RPG: Sword,
  Simulación: Cpu,
  Música: Music,
  Terror: Ghost,
  Supervivencia: Shield,
  Educativo: BookOpen,
  Laberinto: Map,
  Creativo: Palette,
}

/**
 * Returns the Lucide icon component for a given tag name.
 * Falls back to `Gamepad2` if the tag is not in the mapping.
 */
export function getTagIcon(tagName: string): LucideIcon {
  return iconMap[tagName] ?? Gamepad2
}
