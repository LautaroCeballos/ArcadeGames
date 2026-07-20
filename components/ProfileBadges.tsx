import type { Badge } from "@/lib/definitions"

interface ProfileBadgesProps {
  badges: { badges: Badge }[]
}

export function ProfileBadges({ badges }: ProfileBadgesProps) {
  if (badges.length === 0) return null

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Logros</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {badges.map((ub) => (
          <div
            key={ub.badges.id}
            className="group relative flex flex-col items-center gap-2 rounded-xl border bg-card p-4 text-center hover:shadow-sm transition-shadow"
          >
            <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-xl">
              {ub.badges.icon_url ? (
                <img src={ub.badges.icon_url} alt="" className="size-8" />
              ) : (
                <span>🏅</span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{ub.badges.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ub.badges.criteria}</p>
            </div>
            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-card/95 rounded-xl p-3">
              <p className="text-xs text-muted-foreground">{ub.badges.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
