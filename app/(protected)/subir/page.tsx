import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubmitGameForm } from "@/components/SubmitGameForm"

export default async function SubirPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: categories } = await supabase.from("categories").select("*")

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Subir juego</h1>
        <p className="text-sm text-muted-foreground">
          Publicá tu juego de MakeCode Arcade o Scratch
        </p>
      </div>
      <SubmitGameForm categories={(categories ?? []) as { id: string; name: string }[]} />
    </div>
  )
}
