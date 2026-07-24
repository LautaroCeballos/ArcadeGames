import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { AccountForm } from "@/components/AccountForm"
import { ChangePasswordForm } from "@/components/ChangePasswordForm"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Lock } from "lucide-react"

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Cuenta</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Administrá tu perfil y configurá tu cuenta
        </p>
      </div>

      {/* Info + Edit perfil — manejado por AccountForm */}
      <AccountForm profile={profile} />

      {/* Change password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>
            Actualizá la contraseña de tu cuenta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </div>
  )
}
