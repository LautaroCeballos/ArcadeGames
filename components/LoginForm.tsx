"use client"

import { useActionState } from "react"
import { signIn } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, { error: "" })

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input id="password" name="password" type="password" required />
      </div>
      {state.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Ingresando..." : "Ingresar"}
      </Button>
      <p className="text-sm text-center text-muted-foreground">
        ¿No tenés cuenta?{" "}
        <a href="/signup" className="text-primary hover:underline">
          Registrarse
        </a>
      </p>
    </form>
  )
}
