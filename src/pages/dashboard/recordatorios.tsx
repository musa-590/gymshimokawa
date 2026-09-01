import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Cake, Wallet } from 'lucide-react'
import { obtenerRecordatorios } from '@/lib/api/reportes'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'

export function RecordatoriosPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['recordatorios'],
    queryFn: obtenerRecordatorios,
  })

  if (isError) {
    return <p className="text-destructive">Error al cargar recordatorios</p>
  }

  const membresiasColumns: Column<any>[] = [
    { key: 'nombre', label: 'Cliente', render: (m) => <span className="font-medium">{m.nombre}</span> },
    { key: 'dni', label: 'DNI', render: (m) => m.dni },
    { key: 'tipo', label: 'Membresía', render: (m) => m.tipo_membresia ?? '—' },
    {
      key: 'vence',
      label: 'Vence',
      render: (m) => new Date(m.fecha_vencimiento_membresia).toLocaleDateString('es-PE'),
    },
    {
      key: 'dias',
      label: 'Días',
      render: (m) => (
        <Badge variant={m.dias_restantes <= 3 ? 'destructive' : 'warning'}>
          {m.dias_restantes} días
        </Badge>
      ),
    },
  ]

  const cumpleanosColumns: Column<any>[] = [
    { key: 'nombre', label: 'Cliente', render: (c) => <span className="font-medium">{c.nombre}</span> },
    { key: 'dni', label: 'DNI', render: (c) => c.dni },
    { key: 'telefono', label: 'Teléfono', render: (c) => c.telefono ?? '—' },
    {
      key: 'cumple',
      label: 'Cumpleaños',
      render: (c) => new Date(c.proximo_cumpleanos).toLocaleDateString('es-PE'),
    },
  ]

  const fiadosColumns: Column<any>[] = [
    { key: 'cliente', label: 'Cliente', render: (f) => <span className="font-medium">{f.cliente?.nombre ?? '—'}</span> },
    { key: 'monto', label: 'Monto', render: (f) => `S/ ${Number(f.monto_total).toFixed(2)}` },
    { key: 'pagado', label: 'Pagado', render: (f) => `S/ ${Number(f.monto_pagado ?? 0).toFixed(2)}` },
    {
      key: 'saldo',
      label: 'Saldo',
      render: (f) => (
        <span className="font-semibold text-destructive">
          S/ {(Number(f.monto_total) - Number(f.monto_pagado ?? 0)).toFixed(2)}
        </span>
      ),
    },
    {
      key: 'limite',
      label: 'Fecha límite',
      render: (f) => new Date(f.fecha_limite).toLocaleDateString('es-PE'),
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Recordatorios</h1>
        <p className="text-sm text-muted-foreground">Alertas de membresías, cumpleaños y fiados pendientes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            Membresías por vencer
          </CardTitle>
          <CardDescription>Clientes cuya membresía vence pronto</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-6 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={membresiasColumns}
              rows={data?.membresiasPorVencer ?? []}
              getKey={(m) => m.id}
              emptyText="Sin membresías por vencer"
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Cake className="h-4 w-4 text-pink-500" />
            Cumpleaños próximos
          </CardTitle>
          <CardDescription>Clientes que cumplen años en los próximos días</CardDescription>
        </CardHeader>
        <CardContent>
          <CrudTable
            columns={cumpleanosColumns}
            rows={data?.cumpleanosProximos ?? []}
            getKey={(c) => c.id}
            emptyText="Sin cumpleaños próximos"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Fiados pendientes
          </CardTitle>
          <CardDescription>Deudas por cobrar</CardDescription>
        </CardHeader>
        <CardContent>
          <CrudTable
            columns={fiadosColumns}
            rows={data?.fiadosPendientes ?? []}
            getKey={(f) => f.id}
            emptyText="Sin fiados pendientes"
          />
        </CardContent>
      </Card>
    </div>
  )
}
