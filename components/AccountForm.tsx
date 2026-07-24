"use client"

import { useActionState, useState, useRef, useEffect } from "react"
import { updateAccount, checkUsername } from "@/lib/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Save,
  Pencil,
  Check,
  X,
  Loader2,
  Upload,
  CalendarDays,
  Globe,
  Mail,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Profile } from "@/lib/definitions"

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
  { value: "EC", label: "Ecuador" },
  { value: "EG", label: "Egipto" },
  { value: "SV", label: "El Salvador" },
  { value: "AE", label: "Emiratos Árabes Unidos" },
  { value: "ES", label: "España" },
  { value: "US", label: "Estados Unidos" },
  { value: "EE", label: "Estonia" },
  { value: "ET", label: "Etiopía" },
  { value: "PH", label: "Filipinas" },
  { value: "FI", label: "Finlandia" },
  { value: "FR", label: "Francia" },
  { value: "GA", label: "Gabón" },
  { value: "GM", label: "Gambia" },
  { value: "GE", label: "Georgia" },
  { value: "GH", label: "Ghana" },
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

function getCountryLabel(value: string | null): string {
  if (!value) return "No especificado"
  return COUNTRIES.find((c) => c.value === value)?.label ?? value
}

export function AccountForm({ profile: initial }: { profile: Profile }) {
  const [state, formAction, pending] = useActionState(updateAccount, null)
  const [editing, setEditing] = useState(false)
  const [birthMonth, setBirthMonth] = useState(initial.birth_month?.toString() ?? "")
  const [country, setCountry] = useState(initial.country ?? "")
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  // ── Close edit mode on successful save ────────────────────
  useEffect(() => {
    if (state?.success) {
      setEditing(false)
    }
  }, [state])

  // ── Username availability ────────────────────────────────
  const usernameRef = useRef<HTMLInputElement>(null)
  const [usernameStatus, setUsernameStatus] = useState<"idle" | "checking" | "available" | "taken">("idle")

  const handleUsernameBlur = async () => {
    const val = usernameRef.current?.value.trim() ?? ""
    if (!val || val === initial.username) {
      setUsernameStatus("idle")
      return
    }

    const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/
    if (!USERNAME_REGEX.test(val)) {
      setUsernameStatus("idle")
      return
    }

    setUsernameStatus("checking")
    const result = await checkUsername(val, initial.id)
    setUsernameStatus(result.available ? "available" : "taken")
  }

  // ── Avatar preview ───────────────────────────────────────
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setAvatarPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setAvatarPreview(null)
    }
  }

  // ── Cancel editing ──────────────────────────────────────
  const handleCancel = () => {
    setEditing(false)
    setBirthMonth(initial.birth_month?.toString() ?? "")
    setCountry(initial.country ?? "")
    setAvatarPreview(null)
    setUsernameStatus("idle")
  }

  // ── Start editing ────────────────────────────────────────
  const handleStartEdit = () => {
    setBirthMonth(initial.birth_month?.toString() ?? "")
    setCountry(initial.country ?? "")
    setEditing(true)
  }

  // ═══════════════════════════════════════════════════════════
  // VIEW MODE
  // ═══════════════════════════════════════════════════════════
  if (!editing) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle className="text-lg">Información</CardTitle>
          </div>
          <Button variant="outline" size="sm" onClick={handleStartEdit}>
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Editar perfil
          </Button>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Avatar + Username + Email */}
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14 ring-2 ring-arcade-green/20">
              <AvatarImage
                src={initial.avatar_url ?? undefined}
                alt={initial.username ?? ""}
              />
              <AvatarFallback className="text-xl bg-muted text-muted-foreground">
                {(initial.username ?? "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-0.5">
              <p className="text-base font-semibold">@{initial.username}</p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {initial.email}
              </p>
            </div>
          </div>

          {/* Bio */}
          {initial.bio && (
            <>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                  Bio
                </p>
                <p className="text-sm leading-relaxed">{initial.bio}</p>
              </div>
            </>
          )}

          <Separator />

          {/* Demographics grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                Fecha de nacimiento
              </p>
              <p className="text-sm flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {initial.birth_month && initial.birth_year
                  ? `${initial.birth_month}/${initial.birth_year}`
                  : "No especificada"}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
                País
              </p>
              <p className="text-sm flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                {getCountryLabel(initial.country)}
              </p>
            </div>
          </div>

          <Separator />

          {/* Account meta */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1">
              Cuenta creada
            </p>
            <p className="text-sm">
              {new Date(initial.created_at).toLocaleDateString("es-AR", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // ═══════════════════════════════════════════════════════════
  // EDIT MODE
  // ═══════════════════════════════════════════════════════════
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg">Información</CardTitle>
          <CardDescription>Actualizá tu información pública</CardDescription>
        </div>
        <Button variant="ghost" size="sm" onClick={handleCancel}>
          Cancelar
        </Button>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-6">
          {state?.error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {state.error}
            </div>
          )}

          {/* ── Avatar ──────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label>Avatar</Label>
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 ring-2 ring-arcade-green/20">
                <AvatarImage src={avatarPreview ?? initial.avatar_url ?? ""} />
                <AvatarFallback className="text-lg">
                  {(initial.username ?? "U")[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label
                  htmlFor="avatar"
                  className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-transparent px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                >
                  <Upload className="h-4 w-4" />
                  {avatarPreview ? "Cambiar imagen" : "Subir imagen"}
                  <Input
                    id="avatar"
                    name="avatar"
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/gif"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP o GIF. Máximo 2 MB.
                </p>
              </div>
            </div>
          </div>

          {/* ── Username ────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de usuario</Label>
            <div className="relative">
              <Input
                id="username"
                name="username"
                ref={usernameRef}
                defaultValue={initial.username ?? ""}
                onBlur={handleUsernameBlur}
                minLength={3}
                maxLength={30}
                pattern="^[a-zA-Z0-9_]{3,30}$"
                title="Entre 3 y 30 caracteres, solo letras, números y guión bajo"
                className={cn(
                  usernameStatus === "taken" && "border-destructive pr-10",
                  usernameStatus === "available" && "border-green-500 pr-10",
                )}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2">
                {usernameStatus === "checking" && (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                )}
                {usernameStatus === "available" && (
                  <Check className="h-4 w-4 text-green-500" />
                )}
                {usernameStatus === "taken" && (
                  <X className="h-4 w-4 text-destructive" />
                )}
              </span>
            </div>
            {usernameStatus === "taken" && (
              <p className="text-xs text-destructive">Ese nombre de usuario ya está en uso</p>
            )}
            {usernameStatus === "available" && (
              <p className="text-xs text-green-600 dark:text-green-400">¡Nombre de usuario disponible!</p>
            )}
            {usernameStatus === "idle" && (
              <p className="text-xs text-muted-foreground">
                Entre 3 y 30 caracteres. Letras, números y guión bajo.
              </p>
            )}
          </div>

          {/* ── Bio ─────────────────────────────────────────────── */}
          <div className="space-y-2">
            <Label htmlFor="bio">Biografía</Label>
            <Textarea
              id="bio"
              name="bio"
              defaultValue={initial.bio ?? ""}
              placeholder="Contá algo sobre vos..."
              rows={3}
            />
          </div>

          {/* ── Birth date ──────────────────────────────────────── */}
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
                  defaultValue={initial.birth_year?.toString() ?? ""}
                  min={1900}
                  max={new Date().getFullYear()}
                />
              </div>
            </div>
          </fieldset>

          {/* ── Country ─────────────────────────────────────────── */}
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

          {/* ── Actions ─────────────────────────────────────────── */}
          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={handleCancel} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={pending || usernameStatus === "taken"} className="flex-1">
              {pending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar cambios
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
