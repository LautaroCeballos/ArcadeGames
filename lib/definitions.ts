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
      banner_slides: {
        Row: BannerSlide
        Insert: Omit<BannerSlide, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<BannerSlide, "id">>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type UserRole = 'user' | 'moderator' | 'admin'

export interface Profile {
  id: string
  username: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  website: string | null
  birth_month: number | null
  birth_year: number | null
  country: string | null
  role: UserRole
  created_at: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon_url: string | null
  criteria: string
  created_at: string
}

export interface UserBadge {
  user_id: string
  badge_id: string
  earned_at: string
  badges?: Badge
}

export interface Follow {
  follower_id: string
  following_id: string
  created_at: string
  follower?: Pick<Profile, "id" | "username" | "avatar_url">
  following?: Pick<Profile, "id" | "username" | "avatar_url">
}

export interface FollowUserItem {
  id: string
  username: string | null
  avatar_url: string | null
}

export interface ProfileWithStats extends Profile {
  total_games: number
  total_stars: number
  avg_rating: number | null
  followers_count: number
  following_count: number
  badges: (UserBadge & { badges: Badge })[]
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
  status: 'draft' | 'pending' | 'approved' | 'rejected'
  hidden: boolean
  created_at: string
  views: number
  platform: 'makecode' | 'scratch'
  rejection_reason: string | null
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
  profiles: Pick<Profile, "username" | "avatar_url"> | null
  tags: Tag[]
  avg_rating: number | null
  user_rating: number | null
}

export type NotificationType =
  | 'game_approved'
  | 'game_rejected'
  | 'new_game_from_following'
  | 'new_rating'
  | 'new_follower'

export interface AppNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  message: string
  link_url: string
  actor_id: string | null
  read: boolean
  created_at: string
}

export interface BannerSlide {
  id: string
  image_url: string | null
  title: string
  description: string | null
  cta_text: string
  cta_link: string
  sort_order: number
  active: boolean
  overlay_color: string | null
  text_color: string | null
  button_color: string | null
  created_at: string
  updated_at: string
}

export interface PlayerRankingEntry {
  username: string
  avatarUrl: string | null
  totalStars: number
  gamesCount: number
  rankedGames: number
}
