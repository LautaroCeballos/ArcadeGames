import { createClient } from "@/lib/supabase/server"
import type { NotificationType } from "@/lib/definitions"

/**
 * Creates a notification for a user.
 * Uses the security-definer function in the DB to bypass RLS,
 * since the inserting user is not the notification recipient.
 * This is an internal helper called from other server actions.
 */
export async function createNotification({
  user_id,
  type,
  title,
  message,
  link_url,
  actor_id,
}: {
  user_id: string
  type: NotificationType
  title: string
  message: string
  link_url: string
  actor_id?: string | null
}) {
  const supabase = await createClient()
  console.log("[createNotification] Creating:", type, "for user:", user_id)
  const { error } = await supabase.rpc("create_notification", {
    p_user_id: user_id,
    p_type: type,
    p_title: title,
    p_message: message,
    p_link_url: link_url,
    p_actor_id: actor_id ?? null,
  })
  if (error) {
    console.error("[createNotification] RPC error:", error)
  } else {
    console.log("[createNotification] Success:", type)
  }
}
