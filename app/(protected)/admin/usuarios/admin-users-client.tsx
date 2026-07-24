"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Shield, Search, AlertTriangle } from "lucide-react"
import { getUsers, setUserRole } from "@/lib/actions/games"
import type { UserRole } from "@/lib/definitions"

interface UserEntry {
  id: string
  username: string | null
  email: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
}

export function AdminUsersClient() {
  const router = useRouter()
  const [users, setUsers] = useState<UserEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [changingRole, setChangingRole] = useState<string | null>(null)

  const fetchUsers = useCallback(async (searchTerm: string) => {
    setLoading(true)
    setError(null)
    try {
      const result = await getUsers({ search: searchTerm || undefined })
      setUsers(result.users as UserEntry[])
      setTotal(result.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar usuarios")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers("")
  }, [fetchUsers])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(search)
  }

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    setChangingRole(userId)
    setError(null)
    try {
      const result = await setUserRole(userId, newRole)
      if (result.error) {
        setError(result.error)
      } else {
        // Update local state
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cambiar rol")
    } finally {
      setChangingRole(null)
    }
  }

  const roleOptions: { value: UserRole; label: string }[] = [
    { value: "user", label: "Usuario" },
    { value: "moderator", label: "Moderador" },
    { value: "admin", label: "Admin" },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="mb-8 flex items-center gap-3">
        <Shield className="h-8 w-8 text-arcade-red" />
        <div>
          <h1 className="text-2xl font-bold">Administración de Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            {total} usuario{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-6 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por username o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border bg-background py-2 pl-10 pr-4 text-sm outline-none focus:border-arcade-red focus:ring-1 focus:ring-arcade-red"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-arcade-red px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-arcade-red/90"
        >
          Buscar
        </button>
      </form>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-muted" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && users.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
          <Shield className="h-12 w-12" />
          <p className="text-lg font-medium">No se encontraron usuarios</p>
          <p className="text-sm">
            {search ? "Probá con otro término de búsqueda." : "No hay usuarios registrados."}
          </p>
        </div>
      )}

      {/* Users table */}
      {!loading && users.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Usuario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Rol
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase">
                  Registro
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {user.username?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <span className="font-medium text-sm">
                        {user.username ?? "Sin username"}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {user.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as UserRole)
                      }
                      disabled={changingRole === user.id}
                      className={`rounded-md border px-2.5 py-1.5 text-xs font-medium outline-none transition-colors focus:border-arcade-red focus:ring-1 focus:ring-arcade-red ${
                        user.role === "admin"
                          ? "border-red-200 bg-red-50 text-red-700"
                          : user.role === "moderator"
                            ? "border-amber-200 bg-amber-50 text-amber-700"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                      }`}
                    >
                      {roleOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(user.created_at).toLocaleDateString("es-AR", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
