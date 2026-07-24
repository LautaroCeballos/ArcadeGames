import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SubmitGameForm } from "@/components/SubmitGameForm"
import type { Tag } from "@/lib/definitions"

export default async function SubirPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: tags } = await supabase.from("tags").select("*")

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
      <SubmitGameForm tags={(tags ?? []) as Tag[]} />
    </div>
  )
}
