"use client"

import { useActionState } from "react"
import { signUp } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, { error: "" })

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input id="username" name="username" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required minLength={6} />
        <p className="text-xs text-muted-foreground">Mínimo 6 caracteres</p>
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Registrando..." : "Registrarse"}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="text-primary hover:underline">
          Iniciar sesión
        </a>
      </p>
    </form>
  )
}
