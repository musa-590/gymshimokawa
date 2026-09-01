import { useQuery } from '@tanstack/react-query'
import { Users, UserCog, Package, Wallet, TrendingUp, Ticket, TrendingDown, UserPlus, ArrowUpRight, ArrowDownRight, BarChart3, PieChart } from 'lucide-react'
import { obtenerEstadisticasDashboard } from '@/lib/api/reportes'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart, DonutChart } from '@/components/charts'

const formatSoles = (v: number) => `S/ ${v.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function StatCardSkeleton() {
  return (
    <Card className="border-0 bg-gradient-to-br from-muted/50 to-muted/20">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-8 rounded-lg" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-7 w-16" />
      </CardContent>
    </Card>
  )
}

export function DashboardHome() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard-estadisticas'],
    queryFn: obtenerEstadisticasDashboard,
  })

  if (isError) {
    return <p className="text-destructive">Error al cargar el dashboard</p>
  }

  const stats = [
    {
      label: 'Clientes', value: data?.totalClientes ?? 0,
      icon: Users, gradient: 'from-yellow-400/20 to-yellow-400/5', iconBg: 'bg-yellow-400/15 text-yellow-600',
    },
    {
      label: 'Personal', value: data?.totalPersonal ?? 0,
      icon: UserCog, gradient: 'from-blue-400/20 to-blue-400/5', iconBg: 'bg-blue-400/15 text-blue-600',
    },
    {
      label: 'Productos', value: data?.totalProductos ?? 0,
      icon: Package, gradient: 'from-emerald-400/20 to-emerald-400/5', iconBg: 'bg-emerald-400/15 text-emerald-600',
    },
    {
      label: 'Caja', value: data?.cajaAbierta ? 'Abierta' : 'Cerrada',
      icon: Wallet, gradient: 'from-violet-400/20 to-violet-400/5', iconBg: 'bg-violet-400/15 text-violet-600',
    },
  ]

  const moneyStats = [
    {
      label: 'Ventas del mes', value: data?.ventasMes ?? 0,
      icon: TrendingUp, gradient: 'from-emerald-400/20 to-emerald-400/5', iconBg: 'bg-emerald-400/15 text-emerald-600',
      sub: data?.ventasHoy != null ? `S/ ${(data.ventasHoy ?? 0).toFixed(2)} hoy` : null,
    },
    {
      label: 'Membresías del mes', value: data?.membresiasMes ?? 0,
      icon: Ticket, gradient: 'from-sky-400/20 to-sky-400/5', iconBg: 'bg-sky-400/15 text-sky-600',
      sub: null,
    },
    {
      label: 'Egresos del mes', value: data?.egresosMes ?? 0,
      icon: TrendingDown, gradient: 'from-rose-400/20 to-rose-400/5', iconBg: 'bg-rose-400/15 text-rose-600',
      sub: null,
    },
  ]

  const ingresosPorDia = (data?.ventasPorDia ?? []).map((d, i) => ({
    ...d,
    value: d.value + (data?.membresiasPorDia?.[i]?.value ?? 0),
  }))

  const ingresosMes = [
    { label: 'Ventas', value: data?.ventasMes ?? 0, color: '#34d399' },
    { label: 'Membresías', value: data?.membresiasMes ?? 0, color: '#38bdf8' },
    { label: 'Egresos', value: data?.egresosMes ?? 0, color: '#fb7185' },
  ]

  return (
    <div className="space-y-6">
      <div className="animate-slide-up">
        <h1 className="text-2xl font-bold tracking-tight">
          Bienvenido de nuevo, <span className="text-gradient-gold">GYM SHIMOKAWA</span>
        </h1>
        <p className="text-sm text-muted-foreground">Resumen general del gimnasio</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          : stats.map((stat) => (
              <Card
                key={stat.label}
                className={`card-hover animate-slide-up border-0 bg-gradient-to-br ${stat.gradient}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <span className={`rounded-lg p-2 ${stat.iconBg}`}>
                    <stat.icon className="h-4 w-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    {stat.label === 'Clientes' && data?.nuevosClientesMes != null && (
                      <Badge variant="success" className="ml-auto flex items-center gap-1">
                        <UserPlus className="h-3 w-3" /> +{data.nuevosClientesMes}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading
          ? Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)
          : moneyStats.map((stat) => (
              <Card
                key={stat.label}
                className={`card-hover animate-slide-up border-0 bg-gradient-to-br ${stat.gradient}`}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                  <span className={`rounded-lg p-2 ${stat.iconBg}`}>
                    <stat.icon className="h-4 w-4" />
                  </span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatSoles(stat.value)}</div>
                  {stat.sub && <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><ArrowUpRight className="h-3 w-3" /> {stat.sub}</p>}
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="card-hover animate-slide-up border-0 bg-gradient-to-br from-slate-400/10 to-slate-400/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Ingresos últimos 7 días
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-44 w-full" /> : <BarChart data={ingresosPorDia} />}
          </CardContent>
        </Card>

        <Card className="card-hover animate-slide-up border-0 bg-gradient-to-br from-slate-400/10 to-slate-400/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="h-4 w-4 text-muted-foreground" />
              Ingresos del mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-44 w-full" /> : <DonutChart data={ingresosMes} />}
          </CardContent>
        </Card>
      </div>

      {!isLoading && data && data.fiadosPendientes && data.fiadosPendientes.length > 0 && (
        <Card className="card-hover animate-slide-up">
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Fiados pendientes</span>
              <Badge variant="warning">{data.fiadosPendientes.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.fiadosPendientes.slice(0, 5).map((f: any) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border px-3 py-2 transition-colors hover:bg-muted/50">
                <div>
                  <p className="font-medium text-sm">{f.clientes?.nombre ?? '—'}</p>
                  <p className="text-xs text-muted-foreground">Vence: {new Date(f.fecha_limite).toLocaleDateString('es-PE')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-destructive">
                    S/ {(Number(f.monto_total) - Number(f.monto_pagado ?? 0)).toFixed(2)}
                  </span>
                  <ArrowDownRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
