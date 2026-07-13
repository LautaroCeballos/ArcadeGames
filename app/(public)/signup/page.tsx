import { SignUpForm } from "@/components/SignUpForm"

export default function SignUpPage() {
  return (
    <div className="flex items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Crear cuenta</h1>
          <p className="text-sm text-muted-foreground">
            Registrate para publicar juegos
          </p>
        </div>
        <SignUpForm />
      </div>
    </div>
  )
}
