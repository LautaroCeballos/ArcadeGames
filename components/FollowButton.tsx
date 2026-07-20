"use client"

import { useActionState } from "react"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser } from "@/lib/actions/social"

interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}

export function FollowButton({ targetUserId, isFollowing: initialFollowing }: FollowButtonProps) {
  const followAction = async (_prev: { error?: string } | null, formData: FormData) => {
    const action = formData.get("action") as string
    if (action === "unfollow") {
      return await unfollowUser(targetUserId)
    }
    return await followUser(targetUserId)
  }

  const [state, formAction, pending] = useActionState(followAction, null)

  return (
    <form action={formAction}>
      <input type="hidden" name="action" value={initialFollowing ? "unfollow" : "follow"} />
      <Button
        type="submit"
        disabled={pending}
        variant={initialFollowing ? "outline" : "default"}
        size="sm"
        className="gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : initialFollowing ? (
          <UserCheck className="size-4" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {initialFollowing ? "Siguiendo" : "Seguir"}
      </Button>
      {state?.error && (
        <p className="text-xs text-destructive mt-1">{state.error}</p>
      )}
    </form>
  )
}
