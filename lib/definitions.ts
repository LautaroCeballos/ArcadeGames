export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, "created_at">
        Update: Partial<Omit<Profile, "id">>
      }
      categories: {
        Row: Category
        Insert: Pick<Category, "name">
        Update: Partial<Pick<Category, "name">>
      }
      games: {
        Row: Game
        Insert: Omit<Game, "created_at" | "views">
        Update: Partial<Omit<Game, "id">>
      }
      tags: {
        Row: Tag
        Insert: Pick<Tag, "name">
        Update: Partial<Pick<Tag, "name">>
      }
      game_tags: {
        Row: GameTag
        Insert: GameTag
        Update: GameTag
      }
      ratings: {
        Row: Rating
        Insert: Omit<Rating, "id">
        Update: Partial<Omit<Rating, "id">>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  created_at: string
}

export interface Category {
  id: string
  name: string
}

export interface Game {
  id: string
  user_id: string | null
  title: string
  description: string | null
  embed_url: string
  thumbnail_url: string | null
  category_id: string | null
  status: string
  hidden: boolean
  created_at: string
  views: number
}

export interface Tag {
  id: string
  name: string
}

export interface GameTag {
  game_id: string
  tag_id: string
}

export interface Rating {
  id: string
  game_id: string
  user_id: string | null
  value: number
}

export type GameWithDetails = Game & {
  categories: Category | null
  profiles: Pick<Profile, "username" | "avatar_url"> | null
  tags: Tag[]
  avg_rating: number | null
  user_rating: number | null
}
