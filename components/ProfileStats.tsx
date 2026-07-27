"use client"

import Link from "next/link"
import { Star, Gamepad2, Users } from "lucide-react"
import { useRealtimeFollowCounts } from "@/hooks/use-realtime-follow-counts"
import { formatCount } from "@/lib/utils"

interface ProfileStatsProps {
  profileUserId: string
  totalStars: number
  totalGames: number
  followersCount: number
  followingCount: number
  profileUsername: string
}

export function ProfileStats({
  profileUserId,
  totalStars,
  totalGames,
  followersCount: initialFollowers,
  followingCount: initialFollowing,
  profileUsername,
}: ProfileStatsProps) {
  const { followersCount, followingCount } = useRealtimeFollowCounts(
    profileUserId,
    initialFollowers,
    initialFollowing
  )

  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-3">
      <StatCard
        icon={<Star className="size-3.5 sm:size-4 fill-amber-400 text-amber-400" />}
        label="Estrellas"
        value={formatCount(totalStars)}
      />
      <StatCard
        icon={<Gamepad2 className="size-3.5 sm:size-4 text-arcade-green" />}
        label="Juegos"
        value={formatCount(totalGames)}
      />
      <StatCard
        icon={<Users className="size-3.5 sm:size-4 text-blue-400" />}
        label="Seguidores"
        value={formatCount(followersCount)}
        href={`/perfil/${profileUsername}/seguidores`}
      />
      <StatCard
        icon={<Users className="size-3.5 sm:size-4 text-purple-400" />}
        label="Siguiendo"
        value={formatCount(followingCount)}
        href={`/perfil/${profileUsername}/siguiendo`}
      />
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode
  label: string
  value: string
  href?: string
}) {
  const content = (
    <>
      {/* Mobile: icon + value side by side, label centered below */}
      <div className="flex sm:hidden items-center gap-1.5">
        <div className="flex items-center justify-center size-7 rounded-md bg-muted shrink-0">
          {icon}
        </div>
        <p className="text-sm font-bold leading-tight">{value}</p>
      </div>
      <p className="sm:hidden text-[10px] text-muted-foreground leading-tight text-center">{label}</p>

      {/* Desktop: icon + value + label all in one row */}
      <div className="hidden sm:flex sm:items-center gap-3">
        <div className="flex items-center justify-center size-10 rounded-lg bg-muted shrink-0">
          {icon}
        </div>
        <p className="text-lg font-bold leading-tight">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </>
  )

  const cardClasses = "flex flex-col sm:flex-row items-center justify-center sm:justify-start rounded-lg sm:rounded-xl border bg-card p-2 sm:p-3.5 transition-colors hover:bg-accent"

  if (href) {
    return (
      <Link href={href} className={cardClasses}>
        {content}
      </Link>
    )
  }

  return (
    <div className={cardClasses}>
      {content}
    </div>
  )
}
