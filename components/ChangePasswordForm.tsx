"use client"

import { useActionState, useState } from "react"
import { updatePassword } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, Lock } from "lucide-react"

export function ChangePasswordForm() {
  const [state, formAction, pending] = useActionState(updatePassword, null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-green-100 p-3 text-sm text-green-700 dark:bg-green-900/30 dark:text-green-400">
          Contraseña actualizada correctamente
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="password">Nueva contraseña</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <ul className="text-xs text-muted-foreground space-y-0.5 list-inside list-disc">
          <li>Mínimo 8 caracteres</li>
          <li>Al menos una mayúscula</li>
          <li>Al menos una minúscula</li>
          <li>Al menos un número</li>
        </ul>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password_confirm">Confirmar nueva contraseña</Label>
        <div className="relative">
          <Input
            id="password_confirm"
            name="password_confirm"
            type={showConfirm ? "text" : "password"}
            placeholder="Repetí la contraseña"
            required
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            tabIndex={-1}
            aria-label={showConfirm ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        <Lock className="mr-2 h-4 w-4" />
        {pending ? "Actualizando..." : "Actualizar contraseña"}
      </Button>
    </form>
  )
}
