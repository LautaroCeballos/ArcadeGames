"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Search, Upload, Bell, Menu, X, CheckCircle, XCircle, Gamepad2, Star, UserPlus, LogOut, User, Settings, Shield, ChevronDown, Loader2, ImagePlus } from "lucide-react"
import { useState, useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"
import { signOut } from "@/lib/actions/auth"
import { markAsRead, markAllAsRead } from "@/lib/actions/notifications"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { useRealtimeNotifications } from "@/hooks/use-realtime-notifications"
import { searchAll } from "@/lib/actions/search"
import type { AppNotification } from "@/lib/definitions"

interface NavbarClientProps {
  user: {
    id: string
    email?: string | null
  } | null
  username: string | null
  avatarUrl: string | null
  role: 'user' | 'moderator' | 'admin'
  unreadCount?: number
  recentNotifications?: AppNotification[]
  currentUserId: string | null
}

function getNotificationIcon(type: string) {
  switch (type) {
    case "game_approved": return <CheckCircle className="h-4 w-4 text-green-400 shrink-0" />
    case "game_rejected": return <XCircle className="h-4 w-4 text-red-400 shrink-0" />
    case "new_game_from_following": return <Gamepad2 className="h-4 w-4 text-blue-400 shrink-0" />
    case "new_rating": return <Star className="h-4 w-4 text-yellow-400 shrink-0" />
    case "new_follower": return <UserPlus className="h-4 w-4 text-purple-400 shrink-0" />
    default: return <Bell className="h-4 w-4 text-arcade-beige shrink-0" />
  }
}

function timeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diff = Math.floor((now - date) / 1000)
  if (diff < 60) return "ahora"
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  if (diff < 2592000) return `hace ${Math.floor(diff / 86400)} d`
  return new Date(dateStr).toLocaleDateString()
}

export function NavbarClient({ user, username, avatarUrl, role, unreadCount = 0, recentNotifications = [], currentUserId }: NavbarClientProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [bellOpen, setBellOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [searchValue, setSearchValue] = useState("")
  const [searchResults, setSearchResults] = useState<Awaited<ReturnType<typeof searchAll>> | null>(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const bellRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const searchContainerRef = useRef<HTMLDivElement>(null)

  const { notifications: liveNotifications, unreadCount: liveUnreadCount } = useRealtimeNotifications(
    currentUserId,
    { notifications: recentNotifications, unreadCount }
  )

  const closeBell = useCallback(() => setBellOpen(false), [])
  const closeUserMenu = useCallback(() => setUserMenuOpen(false), [])

  // Close dropdowns on click outside
  useEffect(() => {
    if (!bellOpen && !userMenuOpen && !searchOpen) return
    const handleClick = (e: MouseEvent) => {
      if (bellOpen) {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(e.target as Node) &&
          bellRef.current &&
          !bellRef.current.contains(e.target as Node)
        ) {
          closeBell()
        }
      }
      if (userMenuOpen) {
        if (
          userMenuRef.current &&
          !userMenuRef.current.contains(e.target as Node)
        ) {
          closeUserMenu()
        }
      }
      if (searchOpen) {
        if (
          searchContainerRef.current &&
          !searchContainerRef.current.contains(e.target as Node)
        ) {
          setSearchOpen(false)
        }
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [bellOpen, userMenuOpen, searchOpen, closeBell, closeUserMenu])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Debounced live search
  useEffect(() => {
    const trimmed = searchValue.trim()
    if (trimmed.length < 1) {
      setSearchResults(null)
      setSearchOpen(false)
      return
    }
    let cancelled = false
    const timer = setTimeout(async () => {
      setSearchLoading(true)
      try {
        const results = await searchAll(trimmed)
        if (!cancelled) {
          setSearchResults(results)
          setSearchOpen(true)
        }
      } catch {
        if (!cancelled) setSearchResults(null)
      } finally {
        if (!cancelled) setSearchLoading(false)
      }
    }, 500)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [searchValue])

  // Close search on Escape
  useEffect(() => {
    if (!searchOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSearchOpen(false)
    }
    document.addEventListener("keydown", handleKey)
    return () => document.removeEventListener("keydown", handleKey)
  }, [searchOpen])

  useEffect(() => {
    setMenuOpen(false)
    setBellOpen(false)
    setUserMenuOpen(false)
    setSearchOpen(false)
  }, [pathname])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = searchValue.trim()
    if (q) {
      router.push(`/buscar?q=${encodeURIComponent(q)}`)
      setSearchValue("")
    }
  }

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    closeBell()
    router.push(notification.link_url)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
    router.refresh()
  }

  return (
    <header
      className={cn(
        "sticky top-0 z-50 bg-arcade-red transition-shadow duration-200",
        scrolled && "shadow-lg shadow-black/20",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-2 px-4">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-arcade-beige shrink-0"
        >
          ArcadePlay
        </Link>

        {/* Desktop: search + icons + avatar */}
        <div className="hidden items-center gap-1 sm:flex flex-1 justify-end">
          {/* Search input + live dropdown */}
          <div ref={searchContainerRef} className="relative max-w-xs w-full">
            <form onSubmit={handleSearch}>
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-arcade-beige/60 pointer-events-none" />
              <input
                type="text"
                placeholder="Buscar juegos, usuarios..."
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => { if (searchResults) setSearchOpen(true) }}
                className="w-full rounded-lg bg-arcade-beige/20 pl-8 pr-3 py-1.5 text-sm text-arcade-beige placeholder:text-arcade-beige/50 outline-none focus:bg-arcade-beige/30 focus:ring-1 focus:ring-arcade-beige/40 transition-colors"
              />
            </form>

            {/* Live search dropdown */}
            {searchOpen && (
              <div className="absolute left-0 top-full mt-2 w-full rounded-lg border border-arcade-beige/10 bg-arcade-dark shadow-xl shadow-black/40 z-50 overflow-hidden">
                {searchLoading ? (
                  <div className="flex items-center justify-center gap-2 px-4 py-6 text-sm text-arcade-beige/60">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Buscando…
                  </div>
                ) : searchResults && (
                  searchResults.games.length === 0 &&
                  searchResults.users.length === 0 &&
                  searchResults.tags.length === 0
                ) ? (
                  <p className="px-4 py-6 text-center text-sm text-arcade-beige/50">
                    No se encontraron resultados para <span className="font-medium text-arcade-beige/70">&ldquo;{searchValue.trim()}&rdquo;</span>
                  </p>
                ) : searchResults ? (
                  <div className="max-h-[70vh] overflow-y-auto py-2">
                    {/* Games */}
                    {searchResults.games.length > 0 && (
                      <div className="px-2">
                        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-arcade-beige/40">
                          Juegos ({searchResults.games.length})
                        </p>
                        {searchResults.games.slice(0, 6).map((game) => (
                          <Link
                            key={game.id}
                            href={`/juego/${game.id}`}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-arcade-beige/80 hover:text-arcade-beige hover:bg-arcade-red/10 transition-colors"
                          >
                            {game.thumbnail_url ? (
                              <img
                                src={game.thumbnail_url}
                                alt=""
                                className="h-8 w-8 shrink-0 rounded object-cover"
                              />
                            ) : (
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-arcade-beige/10 text-xs text-arcade-beige/40">
                                <Gamepad2 className="h-4 w-4" />
                              </div>
                            )}
                            <div className="min-w-0 flex-1 truncate">
                              <p className="truncate font-medium">{game.title}</p>
                              {game.profiles?.username && (
                                <p className="truncate text-xs text-arcade-beige/50">
                                  por {game.profiles.username}
                                </p>
                              )}
                            </div>
                          </Link>
                        ))}
                        {searchResults.games.length > 6 && (
                          <p className="px-2 pt-1 text-xs text-arcade-beige/40">
                            y {searchResults.games.length - 6} más…
                          </p>
                        )}
                      </div>
                    )}

                    {/* Users */}
                    {searchResults.users.length > 0 && (
                      <div className="mt-1 border-t border-arcade-beige/10 px-2 pt-2">
                        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-arcade-beige/40">
                          Usuarios ({searchResults.users.length})
                        </p>
                        {searchResults.users.slice(0, 5).map((user) => (
                          <Link
                            key={user.id}
                            href={user.username ? `/perfil/${user.username}` : "#"}
                            onClick={() => setSearchOpen(false)}
                            className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-arcade-beige/80 hover:text-arcade-beige hover:bg-arcade-red/10 transition-colors"
                          >
                            <Avatar className="h-7 w-7 shrink-0">
                              {user.avatar_url ? (
                                <AvatarImage src={user.avatar_url} alt={user.username ?? ""} />
                              ) : (
                                <AvatarFallback className="text-[10px] font-bold bg-arcade-beige/20 text-arcade-beige">
                                  {(user.username ?? "?").charAt(0).toUpperCase()}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div className="min-w-0 flex-1 truncate">
                              <p className="truncate font-medium">{user.username ?? "Sin nombre"}</p>
                              {user.bio && (
                                <p className="truncate text-xs text-arcade-beige/50">{user.bio}</p>
                              )}
                            </div>
                          </Link>
                        ))}
                        {searchResults.users.length > 5 && (
                          <p className="px-2 pt-1 text-xs text-arcade-beige/40">
                            y {searchResults.users.length - 5} más…
                          </p>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {searchResults.tags.length > 0 && (
                      <div className="mt-1 border-t border-arcade-beige/10 px-2 pt-2">
                        <p className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-arcade-beige/40">
                          Categorías ({searchResults.tags.length})
                        </p>
                        <div className="flex flex-wrap gap-1.5 px-2 pb-1">
                          {searchResults.tags.map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/?tag=${tag.id}`}
                              onClick={() => setSearchOpen(false)}
                              className="inline-block rounded-full border border-arcade-beige/20 px-3 py-1 text-xs text-arcade-beige/70 hover:text-arcade-beige hover:border-arcade-beige/40 transition-colors"
                            >
                              {tag.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Footer link */}
                    <div className="mt-1 border-t border-arcade-beige/10">
                      <button
                        type="button"
                        onClick={() => {
                          const q = searchValue.trim()
                          if (q) {
                            setSearchOpen(false)
                            router.push(`/buscar?q=${encodeURIComponent(q)}`)
                          }
                        }}
                        className="flex w-full items-center justify-center gap-1 px-4 py-2.5 text-xs text-arcade-beige/60 hover:text-arcade-beige hover:bg-arcade-red/10 transition-colors"
                      >
                        <Search className="h-3.5 w-3.5" />
                        Ver todos los resultados
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </div>

          {user ? (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="text-arcade-beige hover:bg-arcade-red/80"
                asChild
              >
                <Link href="/subir">
                  <Upload className="h-5 w-5" />
                  <span className="sr-only">Subir juego</span>
                </Link>
              </Button>

              {/* Notifications bell */}
              <div className="relative" ref={bellRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-arcade-beige hover:bg-arcade-red/80 relative"
                  onClick={() => setBellOpen((prev) => !prev)}
                  aria-label="Notificaciones"
                >
                  <Bell className="h-5 w-5" />
                  {liveUnreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
                      {liveUnreadCount > 99 ? "99+" : liveUnreadCount}
                    </span>
                  )}
                </Button>

                {bellOpen && (
                  <div
                    ref={dropdownRef}
                    className="absolute right-0 top-full mt-2 w-80 rounded-lg border border-arcade-beige/10 bg-arcade-dark shadow-xl shadow-black/40 z-50"
                  >
                    <div className="flex items-center justify-between border-b border-arcade-beige/10 px-4 py-3">
                      <span className="text-sm font-semibold text-arcade-beige">Notificaciones</span>
                      {liveNotifications.length > 0 && liveUnreadCount > 0 && (
                        <form action={handleMarkAllRead}>
                          <button
                            type="submit"
                            className="text-xs text-arcade-red hover:underline"
                          >
                            Marcar todas leídas
                          </button>
                        </form>
                      )}
                    </div>

                    <div className="max-h-80 overflow-y-auto">
                      {liveNotifications.length === 0 ? (
                        <p className="px-4 py-8 text-center text-sm text-arcade-beige/50">
                          No hay notificaciones
                        </p>
                      ) : (
                        liveNotifications.slice(0, 5).map((n) => (
                          <button
                            key={n.id}
                            type="button"
                            className={cn(
                              "flex w-full items-start gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-arcade-red/10",
                              !n.read && "bg-arcade-red/5"
                            )}
                            onClick={() => handleNotificationClick(n)}
                          >
                            {getNotificationIcon(n.type)}
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-arcade-beige truncate",
                                !n.read && "font-medium"
                              )}>
                                {n.title}
                              </p>
                              <p className="text-arcade-beige/60 text-xs truncate mt-0.5">
                                {n.message}
                              </p>
                              <p className="text-arcade-beige/40 text-[10px] mt-1">
                                {timeAgo(n.created_at)}
                              </p>
                            </div>
                            {!n.read && (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-400" />
                            )}
                          </button>
                        ))
                      )}
                    </div>

                    <Link
                      href="/notificaciones"
                      className="block border-t border-arcade-beige/10 px-4 py-2.5 text-center text-xs text-arcade-beige/70 hover:text-arcade-beige transition-colors"
                      onClick={closeBell}
                    >
                      Ver todas
                    </Link>
                  </div>
                )}
              </div>

              {/* Avatar + user dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((prev) => !prev)}
                  className="flex items-center gap-1 rounded-full p-0.5 text-arcade-beige hover:bg-arcade-red/80 transition-colors"
                  aria-label="Menú de usuario"
                >
                  <Avatar className="h-8 w-8 border-2 border-arcade-beige/30">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={username ?? ""} />
                    ) : (
                      <AvatarFallback className="bg-arcade-beige/20 text-arcade-beige text-xs font-bold">
                        {(username ?? "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <ChevronDown className="h-3.5 w-3.5 text-arcade-beige/70" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-lg border border-arcade-beige/10 bg-arcade-dark shadow-xl shadow-black/40 z-50 overflow-hidden">
                    {/* User info header */}
                    <div className="px-4 py-3 border-b border-arcade-beige/10">
                      <p className="text-sm font-medium text-arcade-beige truncate">
                        {username ?? "Usuario"}
                      </p>
                      {user.email && (
                        <p className="text-xs text-arcade-beige/50 truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                    </div>

                    <div className="py-1">
                      <UserMenuItem
                        href={username ? `/perfil/${username}` : "/dashboard"}
                        icon={<User className="h-4 w-4" />}
                        label="Ver Perfil"
                        onClick={closeUserMenu}
                      />
                      <UserMenuItem
                        href="/cuenta"
                        icon={<Settings className="h-4 w-4" />}
                        label="Mi Cuenta"
                        onClick={closeUserMenu}
                      />
                      {(role === 'moderator' || role === 'admin') && (
                        <UserMenuItem
                          href="/moderar"
                          icon={<Shield className="h-4 w-4" />}
                          label="Moderar"
                          onClick={closeUserMenu}
                        />
                      )}
                      {role === 'admin' && (
                        <UserMenuItem
                          href="/admin/banner"
                          icon={<ImagePlus className="h-4 w-4" />}
                          label="Banner"
                          onClick={closeUserMenu}
                        />
                      )}
                      {role === 'admin' && (
                        <UserMenuItem
                          href="/admin/usuarios"
                          icon={<Shield className="h-4 w-4" />}
                          label="Admin"
                          onClick={closeUserMenu}
                        />
                      )}
                    </div>

                    <div className="border-t border-arcade-beige/10 py-1">
                      <form action={signOut}>
                        <button
                          type="submit"
                          className="flex w-full items-center gap-3 px-4 py-2 text-sm text-arcade-beige/70 hover:text-arcade-beige hover:bg-arcade-red/10 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Cerrar sesión
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="text-arcade-beige hover:bg-arcade-red/80"
                asChild
              >
                <Link href="/login">Iniciar sesión</Link>
              </Button>
              <Button
                size="sm"
                className="bg-arcade-beige text-arcade-dark hover:bg-arcade-beige/90"
                asChild
              >
                <Link href="/signup">Registrarse</Link>
              </Button>
            </>
          )}
        </div>

        {/* Mobile: hamburger */}
        <button
          type="button"
          className="flex sm:hidden p-2 text-arcade-beige"
          onClick={() => setMenuOpen((prev) => !prev)}
          aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-arcade-beige/10 bg-arcade-red px-4 pb-4 sm:hidden">
          {/* Mobile search */}
          <form onSubmit={handleSearch} className="relative mt-3 mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-arcade-beige/60 pointer-events-none" />
            <input
              type="text"
              placeholder="Buscar juegos, usuarios..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-full rounded-lg bg-arcade-beige/20 pl-10 pr-3 py-2 text-sm text-arcade-beige placeholder:text-arcade-beige/50 outline-none focus:bg-arcade-beige/30 focus:ring-1 focus:ring-arcade-beige/40 transition-colors"
            />
          </form>

          <nav className="flex flex-col gap-1 pt-1" role="navigation">
            <MobileNavLink href="/" label="Inicio" />

            {user ? (
              <>
                <MobileNavLink href="/subir" label="Subir juego" icon={<Upload className="h-4 w-4" />} />
                <MobileNavLink href="/notificaciones" label="Notificaciones" icon={<Bell className="h-4 w-4" />} badge={liveUnreadCount} />
                {username && (
                  <MobileNavLink href={`/perfil/${username}`} label="Perfil" icon={<User className="h-4 w-4" />} />
                )}
                {(role === 'moderator' || role === 'admin') && (
                  <MobileNavLink href="/moderar" label="Moderar" icon={<Shield className="h-4 w-4" />} />
                )}
                {role === 'admin' && (
                  <MobileNavLink href="/admin/banner" label="Banner" icon={<ImagePlus className="h-4 w-4" />} />
                )}
                {role === 'admin' && (
                  <MobileNavLink href="/admin/usuarios" label="Admin" icon={<Shield className="h-4 w-4" />} />
                )}
                <MobileNavLink href="/cuenta" label="Cuenta" icon={<Settings className="h-4 w-4" />} />
                <form action={signOut} className="mt-1">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-arcade-beige/70 hover:text-arcade-beige transition-colors hover:bg-arcade-red/80"
                  >
                    <LogOut className="h-4 w-4" />
                    Cerrar sesión
                  </button>
                </form>
              </>
            ) : (
              <>
                <MobileNavLink href="/login" label="Iniciar sesión" />
                <MobileNavLink href="/signup" label="Registrarse" />
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}

function UserMenuItem({ href, icon, label, onClick }: { href: string; icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm text-arcade-beige/70 hover:text-arcade-beige hover:bg-arcade-red/10 transition-colors"
    >
      {icon}
      {label}
    </Link>
  )
}

function MobileNavLink({ href, label, icon, badge }: { href: string; label: string; icon?: React.ReactNode; badge?: number }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-arcade-beige transition-colors hover:bg-arcade-red/80"
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
}
