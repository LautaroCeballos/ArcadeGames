import Link from "next/link"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FollowButton } from "./FollowButton"
import type { FollowUserItem } from "@/lib/definitions"

interface FollowListProps {
  users: FollowUserItem[]
  followingMap: Set<string>
  emptyMessage: string
  currentUserId?: string
}

export function FollowList({ users, followingMap, emptyMessage, currentUserId }: FollowListProps) {
  if (users.length === 0) {
    return (
      <p className="py-12 text-center text-muted-foreground">{emptyMessage}</p>
    )
  }

  return (
    <div className="space-y-2">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3"
        >
          <Link href={`/perfil/${user.username}`} className="flex items-center gap-3 min-w-0 flex-1">
            <Avatar className="size-10 shrink-0">
              <AvatarImage src={user.avatar_url ?? undefined} alt={user.username ?? ""} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {user.username?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-sm font-medium">@{user.username}</span>
          </Link>
          {currentUserId !== user.id && (
            <FollowButton
              targetUserId={user.id}
              isFollowing={followingMap.has(user.id)}
            />
          )}
        </div>
      ))}
    </div>
  )
}
