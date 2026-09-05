import { useEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Users, UserCog, Package, CreditCard, Gift,
  DollarSign, ClipboardCheck, TrendingDown, Bell, LogOut, LayoutDashboard, Menu, X, Shield, FileSpreadsheet, Sun, Moon,
} from 'lucide-react'
import { useSupabase } from '@/providers/supabase-provider'
import { useUserRole } from '@/hooks/use-user-role'
import { useTheme } from '@/hooks/use-theme'
import { obtenerAlertaPago } from '@/lib/api/alerta-pago'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clientes', href: '/dashboard/clientes', icon: Users },
  { name: 'Personal', href: '/dashboard/personal', icon: UserCog },
  { name: 'Productos', href: '/dashboard/productos', icon: Package },
  { name: 'Membresías', href: '/dashboard/membresias', icon: CreditCard },
  { name: 'Promociones', href: '/dashboard/promociones', icon: Gift },
  { name: 'Caja', href: '/dashboard/caja', icon: DollarSign },
  { name: 'Asistencia', href: '/dashboard/asistencia', icon: ClipboardCheck },
  { name: 'Egresos', href: '/dashboard/egresos', icon: TrendingDown },
  { name: 'Recordatorios', href: '/dashboard/recordatorios', icon: Bell },
  { name: 'Exportar', href: '/dashboard/exportar', icon: FileSpreadsheet },
  { name: 'Usuarios', href: '/dashboard/usuarios', icon: Shield, adminOnly: true },
]

export function DashboardLayout() {
  const { supabase, user, authEvent } = useSupabase()
  const { data: rol } = useUserRole()
  const navigate = useNavigate()
  const location = useLocation()
  const { theme, toggle } = useTheme()
  const [menuOpen, setMenuOpen] = useState(false)
  const [welcome, setWelcome] = useState<{ open: boolean; nombre: string }>({ open: false, nombre: '' })
  const [reminderOpen, setReminderOpen] = useState(false)
  const welcomeShown = useRef(false)
  const justSignedIn = useRef(false)
  const prevPath = useRef(location.pathname)

  const { data: alerta } = useQuery({
    queryKey: ['alerta-pago'],
    queryFn: obtenerAlertaPago,
  })
  const inicioHoy = new Date()
  inicioHoy.setHours(0, 0, 0, 0)
  const diasRestantes = alerta?.fecha_vencimiento
    ? Math.round((new Date(`${alerta.fecha_vencimiento}T00:00:00`).getTime() - inicioHoy.getTime()) / 86400000)
    : Infinity
  const debeMostrar = !!alerta?.activado && alerta.fecha_vencimiento != null && diasRestantes <= alerta.dias_aviso
  const fechaTexto = alerta?.fecha_vencimiento
    ? new Date(`${alerta.fecha_vencimiento}T00:00:00`).toLocaleDateString('es-PE')
    : ''

  useEffect(() => {
    if (authEvent === 'SIGNED_IN') justSignedIn.current = true
  }, [authEvent])

  useEffect(() => {
    if (prevPath.current === location.pathname) return
    prevPath.current = location.pathname
    if (debeMostrar && !welcome.open && !justSignedIn.current) setReminderOpen(true)
    // ponytail: el aviso se engancha a cada cambio de ruta; si acaba de loguear, lo dispara el cierre del welcome
  }, [location.pathname, debeMostrar, welcome.open])

  useEffect(() => {
    if (!user || authEvent !== 'SIGNED_IN' || welcomeShown.current) return
    let cancelled = false
    supabase
      .from('usuarios')
      .select('nombre')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return
        welcomeShown.current = true
        setWelcome({ open: true, nombre: (data as { nombre?: string } | null)?.nombre ?? user.email ?? '' })
      })
    return () => {
      cancelled = true
    }
  }, [user, authEvent, supabase])

  const closeWelcome = () => {
    welcomeShown.current = true
    setWelcome({ open: false, nombre: '' })
    const signedIn = justSignedIn.current
    justSignedIn.current = false
    if (debeMostrar && signedIn) setReminderOpen(true)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    toast.success('Sesión cerrada')
    navigate('/login')
  }

  const sidebar = (
    <>
      <div className="p-4 flex items-center gap-3 border-b border-sidebar-border">
        <img
          src="/logo.png"
          alt="Logo GYM SHIMOKAWA"
          className="h-9 w-9 rounded-full border border-yellow-400/60 object-cover animate-glow-pulse"
        />
        <span className="text-base font-bold tracking-tight">
          <span className="text-gradient-gold">GYM</span> SHIMOKAWA
        </span>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {navigation
          .filter((item) => !item.adminOnly || rol === 'admin')
          .map((item, i) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/dashboard'}
            onClick={() => setMenuOpen(false)}
            style={{ animationDelay: `${i * 0.04}s` }}
            className={({ isActive }) =>
              cn(
                'group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold text-sidebar-fg transition-all duration-200 animate-slide-in-left',
                isActive
                  ? 'bg-sidebar-active-bg shadow-[inset_3px_0_0_0_#f9b310]'
                  : 'hover:bg-sidebar-hover hover:translate-x-1'
              )
            }
          >
            <item.icon
              size={18}
              className={cn('transition-transform duration-200 group-hover:scale-110', )}
            />
            {item.name}
            <span className="ml-auto h-1.5 w-1.5 rounded-full bg-yellow-400 opacity-0 transition-opacity group-hover:opacity-60" />
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <p className="text-xs font-bold text-sidebar-fg truncate">{user?.email}</p>
        <button
          onClick={toggle}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-bold transition-all hover:bg-sidebar-hover hover:scale-[1.02] btn-press"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          Modo {theme === 'dark' ? 'claro' : 'oscuro'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 rounded-lg border border-sidebar-border px-3 py-2 text-sm font-bold transition-all hover:bg-red-500/15 hover:border-red-400/40 hover:text-red-300 hover:scale-[1.02] btn-press"
        >
          <LogOut size={16} />
          Cerrar sesión
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-muted/40 flex animate-fade-in">
      <aside className="hidden md:flex w-60 flex-col bg-sidebar-bg text-sidebar-fg fixed inset-y-0 z-20 rounded-r-[2.5rem]">
        {sidebar}
      </aside>

      <Dialog open={menuOpen} onOpenChange={setMenuOpen}>
        <DialogContent className="left-0 top-0 h-full max-w-xs translate-x-0 translate-y-0 rounded-none rounded-r-[2.5rem] bg-sidebar-bg text-sidebar-fg p-0 gap-0 border-r border-sidebar-border [&>button]:hidden">
          <DialogTitle className="sr-only">Menú</DialogTitle>
          <button
            onClick={() => setMenuOpen(false)}
            className="absolute right-4 top-4 z-10 text-sidebar-muted hover:text-sidebar-fg"
          >
            <X size={20} />
          </button>
          {sidebar}
        </DialogContent>
      </Dialog>

      <Dialog open={welcome.open} onOpenChange={(o) => !o && closeWelcome()}>
        <DialogContent className="max-w-sm text-center animate-scale-in">
          <DialogHeader className="items-center text-center">
            <div className="mx-auto mb-2 h-16 w-16 rounded-full bg-yellow-400/15 flex items-center justify-center animate-glow-pulse">
              <img src="/logo.png" alt="Logo GYM SHIMOKAWA" className="h-12 w-12 rounded-full border-2 border-yellow-400 object-cover" />
            </div>
            <DialogTitle className="text-xl font-bold">¡Bienvenido, {welcome.nombre}!</DialogTitle>
            <DialogDescription>
              Bienvenido al panel de GYM SHIMOKAWA, <span className="font-semibold text-foreground">"{welcome.nombre}"</span>. Empezá a gestionar tu gimnasio.
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={closeWelcome}
            className="mt-2 w-full rounded-lg bg-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 hover:bg-yellow-300 btn-press"
          >
            ¡Empezar!
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={reminderOpen} onOpenChange={setReminderOpen}>
        <DialogContent className="max-w-sm !border-0 !bg-transparent !p-0 [&>button]:hidden">
          <div className="relative overflow-hidden rounded-xl border border-red-500/60 bg-background p-6 text-center shadow-lg animate-scale-in animate-blink-red">
            <span className="pointer-events-none absolute -left-3 -top-3 h-12 w-12 rounded-br-3xl bg-gradient-to-br from-red-500 to-yellow-400 animate-corner-blink" />
            <span className="pointer-events-none absolute -right-3 -top-3 h-12 w-12 rounded-bl-3xl bg-gradient-to-bl from-yellow-400 to-red-500 animate-corner-blink" style={{ animationDelay: '0.2s' }} />
            <span className="pointer-events-none absolute -bottom-3 -left-3 h-12 w-12 rounded-tr-3xl bg-gradient-to-tr from-yellow-400 to-red-500 animate-corner-blink" style={{ animationDelay: '0.35s' }} />
            <span className="pointer-events-none absolute -bottom-3 -right-3 h-12 w-12 rounded-tl-3xl bg-gradient-to-tl from-red-500 to-yellow-400 animate-corner-blink" style={{ animationDelay: '0.5s' }} />
            <DialogHeader className="items-center text-center">
              <div className="mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-red-500/15 animate-blink-red">
                <Bell className="h-8 w-8 text-red-500" />
              </div>
              <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-red-500 px-3 py-0.5 text-xs font-bold uppercase tracking-wide text-white animate-pulse">
                Urgente
              </span>
              <DialogTitle className="text-xl font-bold text-red-600">Recordatorio de pago</DialogTitle>
              <DialogDescription>
                Su membresía de almacenamiento{' '}
                {diasRestantes < 0
                  ? `venció el día ${fechaTexto}.`
                  : diasRestantes === 0
                    ? 'vence HOY.'
                    : `está por vencer el día ${fechaTexto} (faltan ${diasRestantes} ${diasRestantes === 1 ? 'día' : 'días'}).`}{' '}
                <span className="font-semibold text-foreground">Actualizar pago.</span>
              </DialogDescription>
            </DialogHeader>
            <button
              onClick={() => setReminderOpen(false)}
              className="mt-2 w-full rounded-lg bg-red-500 px-4 py-2 text-sm font-bold text-white hover:bg-red-600 btn-press"
            >
              Cerrar
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 md:ml-60 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md border-b px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden inline-flex items-center justify-center rounded-lg border border-input p-2 text-muted-foreground hover:bg-accent btn-press"
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
            <span className="md:hidden font-bold text-sm flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="h-7 w-7 rounded-full border border-yellow-400/60 object-cover" />
              <span>
                <span className="text-yellow-500">GYM</span> SHIMOKAWA
              </span>
            </span>
          </div>
          <span className="hidden md:block" />
          <button
            onClick={handleLogout}
            className="md:hidden inline-flex items-center gap-2 text-sm text-destructive btn-press"
          >
            <LogOut size={16} /> Salir
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
