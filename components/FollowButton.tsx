"use client"

import { useActionState } from "react"
import { UserPlus, UserCheck, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { followUser, unfollowUser } from "@/lib/actions/social"

interface FollowButtonProps {
  targetUserId: string
  isFollowing: boolean
}

type FollowState = {
  isFollowing: boolean
  error: string | null
}

export function FollowButton({ targetUserId, isFollowing: initialFollowing }: FollowButtonProps) {
  async function toggleFollow(prevState: FollowState, _formData: FormData): Promise<FollowState> {
    if (prevState.isFollowing) {
      const result = await unfollowUser(targetUserId)
      if (result.error) return { isFollowing: true, error: result.error }
      return { isFollowing: false, error: null }
    } else {
      const result = await followUser(targetUserId)
      if (result.error) return { isFollowing: false, error: result.error }
      return { isFollowing: true, error: null }
    }
  }

  const [state, formAction, pending] = useActionState(toggleFollow, {
    isFollowing: initialFollowing,
    error: null,
  })

  return (
    <form action={formAction}>
      <Button
        type="submit"
        disabled={pending}
        variant={state.isFollowing ? "outline" : "default"}
        size="sm"
        className="gap-1.5"
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : state.isFollowing ? (
          <UserCheck className="size-4" />
        ) : (
          <UserPlus className="size-4" />
        )}
        {state.isFollowing ? "Siguiendo" : "Seguir"}
      </Button>
      {state.error && (
        <p className="text-xs text-destructive mt-1">{state.error}</p>
      )}
    </form>
  )
}
