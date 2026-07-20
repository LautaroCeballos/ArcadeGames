import Link from "next/link"
import { Star, Gamepad2, Users, Globe } from "lucide-react"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { FollowButton } from "./FollowButton"
import type { ProfileWithStats } from "@/lib/definitions"
import { formatCount } from "@/lib/utils"

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Star className="size-4 fill-amber-400 text-amber-400" />} label="Estrellas" value={formatCount(profile.total_stars)} />
        <StatCard icon={<Gamepad2 className="size-4 text-arcade-green" />} label="Juegos" value={formatCount(profile.total_games)} />
        <StatCard icon={<Users className="size-4 text-blue-400" />} label="Seguidores" value={formatCount(profile.followers_count)} />
        <StatCard icon={<Users className="size-4 text-purple-400" />} label="Siguiendo" value={formatCount(profile.following_count)} />
      </div>
    </div>
  )
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3.5">
      <div className="flex items-center justify-center size-10 rounded-lg bg-muted">
        {icon}
      </div>
      <div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  )
}
