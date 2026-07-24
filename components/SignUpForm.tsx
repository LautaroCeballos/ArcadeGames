"use client"

import { useActionState, useState } from "react"
import { signUp, resendVerificationEmail } from "@/lib/actions/auth"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Eye, EyeOff, Mail, CheckCircle } from "lucide-react"

// ─── Country list ────────────────────────────────────────────

const COUNTRIES = [
  { value: "AF", label: "Afganistán" },
  { value: "AL", label: "Albania" },
  { value: "DE", label: "Alemania" },
  { value: "AD", label: "Andorra" },
  { value: "AO", label: "Angola" },
  { value: "AG", label: "Antigua y Barbuda" },
  { value: "SA", label: "Arabia Saudita" },
  { value: "DZ", label: "Argelia" },
  { value: "AR", label: "Argentina" },
  { value: "AM", label: "Armenia" },
  { value: "AU", label: "Australia" },
  { value: "AT", label: "Austria" },
  { value: "AZ", label: "Azerbaiyán" },
  { value: "BS", label: "Bahamas" },
  { value: "BD", label: "Bangladesh" },
  { value: "BB", label: "Barbados" },
  { value: "BE", label: "Bélgica" },
  { value: "BZ", label: "Belice" },
  { value: "BJ", label: "Benín" },
  { value: "BY", label: "Bielorrusia" },
  { value: "BO", label: "Bolivia" },
  { value: "BA", label: "Bosnia y Herzegovina" },
  { value: "BW", label: "Botsuana" },
  { value: "BR", label: "Brasil" },
  { value: "BN", label: "Brunéi" },
  { value: "BG", label: "Bulgaria" },
  { value: "BF", label: "Burkina Faso" },
  { value: "BI", label: "Burundi" },
  { value: "BT", label: "Bután" },
  { value: "CV", label: "Cabo Verde" },
  { value: "KH", label: "Camboya" },
  { value: "CM", label: "Camerún" },
  { value: "CA", label: "Canadá" },
  { value: "QA", label: "Catar" },
  { value: "TD", label: "Chad" },
  { value: "CL", label: "Chile" },
  { value: "CN", label: "China" },
  { value: "CY", label: "Chipre" },
  { value: "CO", label: "Colombia" },
  { value: "KM", label: "Comoras" },
  { value: "CG", label: "Congo" },
  { value: "CD", label: "Congo (RDC)" },
  { value: "KR", label: "Corea del Sur" },
  { value: "KP", label: "Corea del Norte" },
  { value: "CI", label: "Costa de Marfil" },
  { value: "CR", label: "Costa Rica" },
  { value: "HR", label: "Croacia" },
  { value: "CU", label: "Cuba" },
  { value: "DK", label: "Dinamarca" },
  { value: "DM", label: "Dominica" },
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egipto" },
  { value: "SV", label: "El Salvador" },
  { value: "AE", label: "Emiratos Árabes Unidos" },
  { value: "SK", label: "Eslovaquia" },
  { value: "SI", label: "Eslovenia" },
  { value: "ES", label: "España" },
  { value: "US", label: "Estados Unidos" },
  { value: "EE", label: "Estonia" },
  { value: "SZ", label: "Esuatini" },
  { value: "ET", label: "Etiopía" },
  { value: "PH", label: "Filipinas" },
  { value: "FI", label: "Finlandia" },
  { value: "FJ", label: "Fiyi" },
  { value: "FR", label: "Francia" },
  { value: "GA", label: "Gabón" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "GH", label: "Ghana" },
  { value: "GD", label: "Granada" },
  { value: "GR", label: "Grecia" },
  { value: "GT", label: "Guatemala" },
  { value: "GN", label: "Guinea" },
  { value: "GQ", label: "Guinea Ecuatorial" },
  { value: "GW", label: "Guinea-Bisáu" },
  { value: "GY", label: "Guyana" },
  { value: "HT", label: "Haití" },
  { value: "HN", label: "Honduras" },
  { value: "HU", label: "Hungría" },
  { value: "IN", label: "India" },
  { value: "ID", label: "Indonesia" },
  { value: "IQ", label: "Irak" },
  { value: "IR", label: "Irán" },
  { value: "IE", label: "Irlanda" },
  { value: "IS", label: "Islandia" },
  { value: "IL", label: "Israel" },
  { value: "IT", label: "Italia" },
  { value: "JM", label: "Jamaica" },
  { value: "JP", label: "Japón" },
  { value: "JO", label: "Jordania" },
  { value: "KZ", label: "Kazajistán" },
  { value: "KE", label: "Kenia" },
  { value: "KG", label: "Kirguistán" },
  { value: "KI", label: "Kiribati" },
  { value: "KW", label: "Kuwait" },
  { value: "LA", label: "Laos" },
  { value: "LS", label: "Lesoto" },
  { value: "LV", label: "Letonia" },
  { value: "LB", label: "Líbano" },
  { value: "LR", label: "Liberia" },
  { value: "LY", label: "Libia" },
  { value: "LI", label: "Liechtenstein" },
  { value: "LT", label: "Lituania" },
  { value: "LU", label: "Luxemburgo" },
  { value: "MG", label: "Madagascar" },
  { value: "MY", label: "Malasia" },
  { value: "MW", label: "Malaui" },
  { value: "MV", label: "Maldivas" },
  { value: "ML", label: "Malí" },
  { value: "MT", label: "Malta" },
  { value: "MA", label: "Marruecos" },
  { value: "MU", label: "Mauricio" },
  { value: "MR", label: "Mauritania" },
  { value: "MX", label: "México" },
  { value: "FM", label: "Micronesia" },
  { value: "MD", label: "Moldavia" },
  { value: "MC", label: "Mónaco" },
  { value: "MN", label: "Mongolia" },
  { value: "ME", label: "Montenegro" },
  { value: "MZ", label: "Mozambique" },
  { value: "MM", label: "Myanmar" },
  { value: "NA", label: "Namibia" },
  { value: "NR", label: "Nauru" },
  { value: "NP", label: "Nepal" },
  { value: "NI", label: "Nicaragua" },
  { value: "NE", label: "Níger" },
  { value: "NG", label: "Nigeria" },
  { value: "NO", label: "Noruega" },
  { value: "NZ", label: "Nueva Zelanda" },
  { value: "OM", label: "Omán" },
  { value: "NL", label: "Países Bajos" },
  { value: "PK", label: "Pakistán" },
  { value: "PW", label: "Palaos" },
  { value: "PA", label: "Panamá" },
  { value: "PG", label: "Papúa Nueva Guinea" },
  { value: "PY", label: "Paraguay" },
  { value: "PE", label: "Perú" },
  { value: "PL", label: "Polonia" },
  { value: "PT", label: "Portugal" },
  { value: "PR", label: "Puerto Rico" },
  { value: "GB", label: "Reino Unido" },
  { value: "CF", label: "República Centroafricana" },
  { value: "CZ", label: "República Checa" },
  { value: "MK", label: "República de Macedonia del Norte" },
  { value: "DO", label: "República Dominicana" },
  { value: "RW", label: "Ruanda" },
  { value: "RO", label: "Rumania" },
  { value: "RU", label: "Rusia" },
  { value: "WS", label: "Samoa" },
  { value: "SM", label: "San Marino" },
  { value: "ST", label: "Santo Tomé y Príncipe" },
  { value: "SN", label: "Senegal" },
  { value: "RS", label: "Serbia" },
  { value: "SC", label: "Seychelles" },
  { value: "SL", label: "Sierra Leona" },
  { value: "SG", label: "Singapur" },
  { value: "SY", label: "Siria" },
  { value: "SO", label: "Somalia" },
  { value: "LK", label: "Sri Lanka" },
  { value: "ZA", label: "Sudáfrica" },
  { value: "SD", label: "Sudán" },
  { value: "SS", label: "Sudán del Sur" },
  { value: "SE", label: "Suecia" },
  { value: "CH", label: "Suiza" },
  { value: "SR", label: "Surinam" },
  { value: "TH", label: "Tailandia" },
  { value: "TZ", label: "Tanzania" },
  { value: "TJ", label: "Tayikistán" },
  { value: "TL", label: "Timor Oriental" },
  { value: "TG", label: "Togo" },
  { value: "TO", label: "Tonga" },
  { value: "TT", label: "Trinidad y Tobago" },
  { value: "TN", label: "Túnez" },
  { value: "TM", label: "Turkmenistán" },
  { value: "TR", label: "Turquía" },
  { value: "TV", label: "Tuvalu" },
  { value: "UA", label: "Ucrania" },
  { value: "UG", label: "Uganda" },
  { value: "UY", label: "Uruguay" },
  { value: "UZ", label: "Uzbekistán" },
  { value: "VU", label: "Vanuatu" },
  { value: "VA", label: "Vaticano" },
  { value: "VE", label: "Venezuela" },
  { value: "VN", label: "Vietnam" },
  { value: "YE", label: "Yemen" },
  { value: "DJ", label: "Yibuti" },
  { value: "ZM", label: "Zambia" },
  { value: "ZW", label: "Zimbabue" },
] as const

// ─── Months ──────────────────────────────────────────────────

const MONTHS = [
  { value: "1", label: "Enero" },
  { value: "2", label: "Febrero" },
  { value: "3", label: "Marzo" },
  { value: "4", label: "Abril" },
  { value: "5", label: "Mayo" },
  { value: "6", label: "Junio" },
  { value: "7", label: "Julio" },
  { value: "8", label: "Agosto" },
  { value: "9", label: "Septiembre" },
  { value: "10", label: "Octubre" },
  { value: "11", label: "Noviembre" },
  { value: "12", label: "Diciembre" },
] as const

// ─── Password visibility toggle ──────────────────────────────

function PasswordInput({
  id,
  name,
  placeholder,
  required,
  show,
  onToggle,
}: {
  id: string
  name: string
  placeholder?: string
  required?: boolean
  show: boolean
  onToggle: () => void
}) {
  return (
    <div className="relative">
      <Input
        id={id}
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        autoComplete={id === "password" ? "new-password" : "off"}
        className="pr-10"
      />
      <button
        type="button"
        onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        tabIndex={-1}
        aria-label={show ? "Ocultar contraseña" : "Mostrar contraseña"}
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  )
}

// ─── Main form ───────────────────────────────────────────────

export function SignUpForm() {
  const [state, formAction, pending] = useActionState(signUp, undefined)
  const [resendState, resendAction, resendPending] = useActionState(resendVerificationEmail, undefined)

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [birthMonth, setBirthMonth] = useState("")
  const [country, setCountry] = useState("")

  // → Success screen after signup
  if (state?.success) {
    return (
      <div className="space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">¡Registrado con éxito!</h2>
          <p className="text-sm text-muted-foreground">
            Te enviamos un email de verificación. Revisá tu bandeja de entrada y hacé clic en el
            enlace para activar tu cuenta.
          </p>
        </div>
        <form action={resendAction} className="space-y-3">
          <Label htmlFor="resend-email" className="sr-only">
            Email
          </Label>
          <Input
            id="resend-email"
            name="email"
            type="email"
            placeholder="tu@email.com"
            required
          />
          {resendState?.error && (
            <p className="text-sm text-destructive">{resendState.error}</p>
          )}
          {resendState?.success && (
            <p className="text-sm text-green-600 dark:text-green-400">
              ¡Email reenviado! Revisá tu bandeja de entrada.
            </p>
          )}
          <Button type="submit" variant="outline" className="w-full" disabled={resendPending}>
            <Mail className="mr-2 h-4 w-4" />
            {resendPending ? "Reenviando..." : "Reenviar email de verificación"}
          </Button>
        </form>
        <p className="text-sm text-muted-foreground">
          ¿Ya verificaste?{" "}
          <a href="/login" className="text-primary hover:underline">
            Iniciar sesión
          </a>
        </p>
      </div>
    )
  }

  // → Registration form
  return (
    <form action={formAction} className="space-y-5">
      {/* ── Username ──────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="username">Nombre de usuario</Label>
        <Input
          id="username"
          name="username"
          placeholder="ej: gamer_pro23"
          required
          minLength={3}
          maxLength={30}
          pattern="^[a-zA-Z0-9_]{3,30}$"
          title="Entre 3 y 30 caracteres, solo letras, números y guión bajo"
          autoComplete="username"
        />
        <p className="text-xs text-muted-foreground">
          Entre 3 y 30 caracteres. Letras, números y guión bajo.
        </p>
      </div>

      {/* ── Email ─────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="tu@email.com"
          required
          autoComplete="email"
        />
      </div>

      {/* ── Contraseña ────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <PasswordInput
          id="password"
          name="password"
          placeholder="Mínimo 8 caracteres"
          required
          show={showPassword}
          onToggle={() => setShowPassword(!showPassword)}
        />
        <ul className="text-xs text-muted-foreground space-y-0.5 list-inside list-disc">
          <li>Mínimo 8 caracteres</li>
          <li>Al menos una mayúscula</li>
          <li>Al menos una minúscula</li>
          <li>Al menos un número</li>
        </ul>
      </div>

      {/* ── Confirmar contraseña ──────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="password_confirm">Confirmar contraseña</Label>
        <PasswordInput
          id="password_confirm"
          name="password_confirm"
          placeholder="Repetí la contraseña"
          required
          show={showConfirm}
          onToggle={() => setShowConfirm(!showConfirm)}
        />
      </div>

      {/* ── Mes y año de nacimiento ───────────────────────── */}
      <fieldset>
        <legend className="text-sm font-medium mb-2">Fecha de nacimiento</legend>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="birth_month">Mes</Label>
            <Select value={birthMonth} onValueChange={setBirthMonth}>
              <SelectTrigger id="birth_month">
                <SelectValue placeholder="Mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input type="hidden" name="birth_month" value={birthMonth} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="birth_year">Año</Label>
            <Input
              id="birth_year"
              name="birth_year"
              type="number"
              placeholder="AAAA"
              min={1900}
              max={new Date().getFullYear()}
            />
          </div>
        </div>
      </fieldset>

      {/* ── País ──────────────────────────────────────────── */}
      <div className="space-y-2">
        <Label htmlFor="country">País</Label>
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger id="country">
            <SelectValue placeholder="Seleccioná tu país" />
          </SelectTrigger>
          <SelectContent className="max-h-[260px]">
            {COUNTRIES.map((c) => (
              <SelectItem key={c.value} value={c.value}>
                {c.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input type="hidden" name="country" value={country} />
      </div>

      {/* ── Error general ─────────────────────────────────── */}
      {state?.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      {/* ── Submit ────────────────────────────────────────── */}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Registrando..." : "Crear cuenta"}
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
