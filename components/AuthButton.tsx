import { signOut } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"

export function AuthButton() {
  return (
    <form action={signOut}>
      <Button variant="outline" size="sm" type="submit">
        Cerrar sesión
      </Button>
    </form>
  )
}
