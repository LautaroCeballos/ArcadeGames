import { Globe } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FollowButton } from "./FollowButton"
import { ProfileStats } from "./ProfileStats"
import type { ProfileWithStats } from "@/lib/definitions"

interface ProfileHeaderProps {
  profile: ProfileWithStats
  isOwnProfile: boolean
  isFollowing: boolean
}

export function ProfileHeader({ profile, isOwnProfile, isFollowing }: ProfileHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start gap-5">
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 ring-2 ring-arcade-green/30">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.username ?? ""} />
          <AvatarFallback className="text-2xl sm:text-3xl bg-muted text-muted-foreground">
            {profile.username?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0 space-y-1.5">
          <h1 className="text-2xl font-bold truncate">@{profile.username}</h1>

          {profile.bio && (
            <p className="text-muted-foreground text-sm leading-relaxed">{profile.bio}</p>
          )}

          {profile.website && (
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-arcade-green hover:underline"
            >
              <Globe className="size-3.5" />
              {profile.website.replace(/^https?:\/\//, "")}
            </a>
          )}

          {!isOwnProfile && (
            <div className="pt-1">
              <FollowButton targetUserId={profile.id} isFollowing={isFollowing} />
            </div>
          )}
        </div>
      </div>

      <ProfileStats
        profileUserId={profile.id}
        totalStars={profile.total_stars}
        totalGames={profile.total_games}
        followersCount={profile.followers_count}
        followingCount={profile.following_count}
        profileUsername={profile.username ?? ""}
      />
    </div>
  )
}
