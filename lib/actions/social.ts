"use server"

import { revalidatePath, refresh as refreshRouter } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { createNotification } from "@/lib/notifications"

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

  // Notify the followed user
  const { data: followerProfile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single()

  await createNotification({
    user_id: targetUserId,
    type: "new_follower",
    title: "Nuevo seguidor",
    message: `${followerProfile?.username ?? "Alguien"} empezó a seguirte`,
    link_url: `/perfil/${followerProfile?.username ?? user.id}`,
    actor_id: user.id,
  })

  await revalidateProfilePage(targetUserId)
  refreshRouter()
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

  await revalidateProfilePage(targetUserId)
  refreshRouter()
  return { success: true }
}

async function revalidateProfilePage(userId: string) {
  const supabase = await createClient()
  const { data: target } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .single()

  revalidatePath("/perfil", "layout")
  if (target?.username) {
    revalidatePath(`/perfil/${target.username}`, "page")
    revalidatePath(`/perfil/${target.username}/seguidores`, "page")
    revalidatePath(`/perfil/${target.username}/siguiendo`, "page")
  }
}

export async function isFollowing(targetUserId: string) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false

  const { data, error } = await supabase
    .from("follows")
    .select("follower_id")
    .eq("follower_id", user.id)
    .eq("following_id", targetUserId)
    .maybeSingle()

  if (error) {
    console.error("isFollowing error:", error)
    return false
  }

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
