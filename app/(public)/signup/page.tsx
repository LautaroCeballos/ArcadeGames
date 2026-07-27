import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SignUpForm } from "@/components/SignUpForm"

export default async function SignUpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Already logged in → redirect to dashboard
  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="flex items-start justify-center px-4 py-8 sm:py-12">
      <div className="w-full max-w-xl space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Registrate para publicar juegos y votar
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
