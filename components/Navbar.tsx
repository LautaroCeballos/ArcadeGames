import { createClient } from "@/lib/supabase/server"
import { NavbarClient } from "./NavbarClient"
import { getUnreadCount, getRecentNotifications } from "@/lib/actions/notifications"
import type { UserRole, AppNotification } from "@/lib/definitions"

export async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let username: string | null = null
  let avatarUrl: string | null = null
  let role: UserRole = 'user'
  let unreadCount = 0
  let recentNotifications: AppNotification[] = []
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("username, avatar_url, role")
      .eq("id", user.id)
      .maybeSingle()
    username = profile?.username ?? null
    avatarUrl = profile?.avatar_url ?? null
    role = profile?.role ?? 'user'
    ;[unreadCount, recentNotifications] = await Promise.all([
      getUnreadCount(),
      getRecentNotifications(5),
    ])
  }

  return (
    <NavbarClient
      user={user}
      username={username}
      avatarUrl={avatarUrl}
      role={role}
      unreadCount={unreadCount}
      recentNotifications={recentNotifications}
      currentUserId={user?.id ?? null}
    />
  )
}
