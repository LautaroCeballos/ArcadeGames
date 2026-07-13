import { LoginForm } from "@/components/LoginForm"

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Iniciar sesión</h1>
          <p className="text-sm text-muted-foreground">
            Ingresá con tu email y contraseña
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
