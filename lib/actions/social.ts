"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"

export async function followUser(targetUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  if (user.id === targetUserId) {
    return { error: "No puedes seguirte a ti mismo" }
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: user.id, following_id: targetUserId })

  if (error) {
    if (error.code === "23505") return { error: "Ya sigues a este usuario" }
    return { error: error.message }
  }

  revalidatePath("/perfil", "layout")
  return { success: true }
}

export async function unfollowUser(targetUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Debes iniciar sesión" }

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)

  if (error) return { error: error.message }

  revalidatePath("/perfil", "layout")
  return { success: true }
}

export async function isFollowing(targetUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data } = await supabase
    .from("follows")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle()

  return data !== null
}

export async function getFollowers(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return []

  const { data } = await supabase
    .from("follows")
    .select("follower_id, created_at, follower:profiles!follows_follower_id_fkey(id, username, avatar_url)")
    .eq("following_id", profile.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as { follower_id: string; created_at: string; follower: { id: string; username: string | null; avatar_url: string | null } }[]
}

export async function getFollowing(username: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle()

  if (!profile) return []

  const { data } = await supabase
    .from("follows")
    .select("following_id, created_at, following:profiles!follows_following_id_fkey(id, username, avatar_url)")
    .eq("follower_id", profile.id)
    .order("created_at", { ascending: false })

  return (data ?? []) as unknown as { following_id: string; created_at: string; following: { id: string; username: string | null; avatar_url: string | null } }[]
}
