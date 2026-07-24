import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminUsersClient } from "./admin-users-client"
import type { UserRole } from "@/lib/definitions"

export default async function AdminUsuariosPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()

  const role = (profile?.role ?? 'user') as UserRole
  if (role !== 'admin') {
    redirect("/")
  }

  return <AdminUsersClient />
}
