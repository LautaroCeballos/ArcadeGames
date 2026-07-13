import { redirect } from "next/navigation"
import Link from "next/link"
import { createClient } from "@/lib/supabase/server"
import { getMyGames } from "@/lib/actions/games"
import { GameActions } from "@/components/GameActions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const games = await getMyGames()

  const statusVariant = (status: string) => {
    switch (status) {
      case "approved": return "default" as const
      case "pending": return "secondary" as const
      case "rejected": return "destructive" as const
      default: return "outline" as const
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Administrá tus juegos
          </p>
        </div>
        <Button asChild>
          <Link href="/subir">Subir juego</Link>
        </Button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-lg">No publicaste juegos aún</p>
          <Button asChild className="mt-4">
            <Link href="/subir">Publicar tu primer juego</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {games.map((game) => (
            <div
              key={game.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/juego/${game.id}`}
                    className="font-medium hover:underline truncate"
                  >
                    {game.title}
                  </Link>
                  <Badge variant={statusVariant(game.status)}>
                    {game.status}
                  </Badge>
                  {game.hidden && (
                    <Badge variant="outline" className="text-muted-foreground">
                      Oculto
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ID: {game.id} · Vistas: {game.views}
                </p>
              </div>
              <GameActions gameId={game.id} hidden={game.hidden} />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
