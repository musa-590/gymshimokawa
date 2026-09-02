import { useState } from 'react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Star, Globe, Trash2 } from 'lucide-react'
import {
  listarClientes, obtenerHistorialCliente, eliminarCliente, eliminarClienteDefinitivo,
} from '@/lib/api/clientes'
import { listarTiposMembresia } from '@/lib/api/membresias'
import type { Cliente } from '@/lib/types'
import { useSupabase } from '@/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'
import { ClienteDialog } from '@/components/cliente-dialog'
import { Pagination } from '@/components/ui/pagination'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAGE_SIZE = 10

const estadoBadge = {
  activo: 'success' as const,
  por_vencer: 'warning' as const,
  inactivo: 'destructive' as const,
}

const estadoLabel = { activo: 'Activo', por_vencer: 'Por vencer', inactivo: 'Inactivo' }

export function ClientesPage() {
  const { user } = useSupabase()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroMembresia, setFiltroMembresia] = useState<string>('todos')
  const [filtroVip, setFiltroVip] = useState<boolean>(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [eliminando, setEliminando] = useState<Cliente | null>(null)
  const [verDetalle, setVerDetalle] = useState<Cliente | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search, filtroEstado, filtroMembresia, filtroVip, page],
    queryFn: () =>
      listarClientes({
        search: search || undefined,
        estado: filtroEstado === 'todos' ? undefined : (filtroEstado as Cliente['estado']),
        tipoMembresiaId: filtroMembresia === 'todos' ? undefined : filtroMembresia,
        es_vip: filtroVip ? true : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  })
  const clientes = data?.data ?? []
  const total = data?.count ?? 0

  const { data: tiposMembresia } = useQuery({
    queryKey: ['tipos-membresia'],
    queryFn: () => listarTiposMembresia(),
  })

  const desactivarMutation = useMutation({
    mutationFn: (id: string) => eliminarCliente(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente desactivado')
      setEliminando(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const eliminarDefinitivoMutation = useMutation({
    mutationFn: (id: string) => eliminarClienteDefinitivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Cliente eliminado permanentemente')
      setEliminando(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Cliente>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (c) => (
        <span className="font-medium inline-flex items-center gap-2">
          {c.nombre}
          {c.es_vip && <Badge variant="warning"><Star className="h-3 w-3" /> VIP</Badge>}
          {c.es_extranjero && <Badge variant="outline"><Globe className="h-3 w-3" /> Ext</Badge>}
        </span>
      ),
    },
    {
      key: 'documento',
      label: 'Documento',
      render: (c) => c.es_extranjero ? (c.carnet_extranjeria ?? '—') : c.dni,
    },
    { key: 'telefono', label: 'Teléfono', render: (c) => c.telefono ?? '—', hideInCard: true },
    {
      key: 'membresia',
      label: 'Membresía',
      render: (c) => c.tipo_membresia?.nombre ?? '—',
    },
    {
      key: 'vencimiento',
      label: 'Vence',
      render: (c) => c.fecha_vencimiento_membresia
        ? new Date(c.fecha_vencimiento_membresia).toLocaleDateString('es-PE')
        : '—',
      hideInCard: true,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (c) => <Badge variant={estadoBadge[c.estado]}>{estadoLabel[c.estado]}</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">Gestiona los clientes del gimnasio</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null)
            setModalOpen(true)
          }}
        >
          <Plus /> Nuevo cliente
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por nombre o DNI..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="max-w-xs"
        />
        <Select value={filtroEstado} onValueChange={(v) => { setFiltroEstado(v); setPage(1) }}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="activo">Activos</SelectItem>
            <SelectItem value="por_vencer">Por vencer</SelectItem>
            <SelectItem value="inactivo">Inactivos</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filtroMembresia} onValueChange={(v) => { setFiltroMembresia(v); setPage(1) }}>
          <SelectTrigger className="w-56">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las membresías</SelectItem>
            {tiposMembresia?.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <button
          onClick={() => { setFiltroVip(!filtroVip); setPage(1) }}
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${
            filtroVip
              ? 'bg-yellow-400 border-yellow-400 text-zinc-900 shadow-sm'
              : 'bg-muted border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Star className="h-3.5 w-3.5" />
          VIP {filtroVip ? 'ON' : 'OFF'}
        </button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
          <CardDescription>{total} clientes</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando clientes...</p>
          ) : (
            <>
              <CrudTable
                columns={columns}
                rows={clientes}
                getKey={(c) => c.id}
                emptyText="No hay clientes"
                onEdit={(c) => { setEditando(c); setModalOpen(true) }}
                onDelete={(c) => setEliminando(c)}
                onRowClick={setVerDetalle}
              />
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <ClienteDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        cliente={editando}
        userId={user?.id ?? ''}
      />

      <DetalleClienteDialog cliente={verDetalle} onClose={() => setVerDetalle(null)} />

      <Dialog open={!!eliminando} onOpenChange={() => setEliminando(null)}>
        <DialogContent>
          <DialogHeader>
            {eliminando?.estado === 'inactivo' ? (
              <>
                <DialogTitle className="flex items-center gap-2 text-destructive">
                  <Trash2 className="h-5 w-5" />
                  Eliminar permanentemente
                </DialogTitle>
                <DialogDescription>
                  <strong>{eliminando?.nombre}</strong> ya está inactivo. ¿Eliminar permanentlye? Esta acción no se puede deshacer.
                </DialogDescription>
              </>
            ) : (
              <>
                <DialogTitle className="flex items-center gap-2 text-amber-600">
                  <Trash2 className="h-5 w-5" />
                  Desactivar cliente
                </DialogTitle>
                <DialogDescription>
                  Se marcará a <strong>{eliminando?.nombre}</strong> como inactivo. Podrás eliminarlo permanentemente después.
                </DialogDescription>
              </>
            )}
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminando(null)}>Cancelar</Button>
            {eliminando?.estado === 'inactivo' ? (
              <Button
                variant="destructive"
                disabled={eliminarDefinitivoMutation.isPending}
                onClick={() => eliminando && eliminarDefinitivoMutation.mutate(eliminando.id)}
              >
                {eliminarDefinitivoMutation.isPending ? 'Eliminando...' : 'Eliminar permanentemente'}
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={desactivarMutation.isPending}
                onClick={() => eliminando && desactivarMutation.mutate(eliminando.id)}
              >
                {desactivarMutation.isPending ? 'Desactivando...' : 'Desactivar'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function DetalleClienteDialog({ cliente, onClose }: { cliente: Cliente | null; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['cliente-detalle', cliente?.id],
    queryFn: () => (cliente ? obtenerHistorialCliente(cliente.id) : Promise.resolve(null)),
    enabled: !!cliente,
  })

  const totalProductos = (data?.ventas ?? []).reduce((acc: number, v: any) => acc + Number(v.total), 0)
  const totalMembresias = (data?.pagos ?? []).reduce((acc: number, p: any) => acc + Number(p.monto_final), 0)

  return (
    <Dialog open={!!cliente} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            {cliente?.nombre}
            {cliente && (
              <>
                <Badge variant={estadoBadge[cliente.estado]}>{estadoLabel[cliente.estado]}</Badge>
                {cliente.es_vip && <Badge variant="warning"><Star className="h-3 w-3" /> VIP</Badge>}
                {cliente.es_extranjero && <Badge variant="outline"><Globe className="h-3 w-3" /> Ext</Badge>}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {cliente?.es_extranjero ? (cliente.carnet_extranjeria ?? '—') : cliente?.dni}
            {cliente?.telefono ? ` · ${cliente.telefono}` : ''}
            {cliente?.fecha_cumpleanos
              ? ` · Cumple: ${new Date(cliente.fecha_cumpleanos).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}`
              : ''}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <p className="text-muted-foreground py-8 text-center">Cargando historial...</p>
        ) : cliente ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">Membresía actual</p>
                <p className="font-semibold">{cliente.tipo_membresia?.nombre ?? 'Sin membresía'}</p>
                {cliente.fecha_vencimiento_membresia && (
                  <p className="text-xs text-muted-foreground">
                    Vence: {new Date(cliente.fecha_vencimiento_membresia).toLocaleDateString('es-PE')}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-muted-foreground text-xs">Gasto acumulado</p>
                <p className="font-semibold">S/ {(totalProductos + totalMembresias).toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  S/ {totalMembresias.toFixed(2)} membresías · S/ {totalProductos.toFixed(2)} productos
                </p>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Membresías adquiridas ({data?.pagos?.length ?? 0})</p>
              <CrudTable
                columns={[
                  {
                    key: 'fecha',
                    label: 'Fecha',
                    render: (p: any) => new Date(p.created_at).toLocaleDateString('es-PE'),
                  },
                  { key: 'plan', label: 'Plan', render: (p: any) => p.tipos_membresia?.nombre ?? '—' },
                  { key: 'vence', label: 'Vence', render: (p: any) => new Date(p.fecha_vencimiento).toLocaleDateString('es-PE') },
                  { key: 'metodo', label: 'Método', render: (p: any) => <span className="capitalize">{p.metodo_pago}</span> },
                  { key: 'monto', label: 'Monto', render: (p: any) => <span className="font-semibold tabular-nums">S/ {Number(p.monto_final).toFixed(2)}</span> },
                ]}
                rows={data?.pagos ?? []}
                getKey={(p: any) => p.id}
                emptyText="Sin membresías adquiridas"
              />
            </div>

            <div>
              <p className="text-sm font-semibold mb-2">Compras de productos ({data?.ventas?.length ?? 0})</p>
              <CrudTable
                columns={[
                  {
                    key: 'fecha',
                    label: 'Fecha',
                    render: (v: any) => new Date(v.created_at).toLocaleDateString('es-PE'),
                  },
                  {
                    key: 'productos',
                    label: 'Productos',
                    render: (v: any) => (v.detalle_ventas ?? []).map((d: any) => `${d.cantidad}x ${d.productos?.nombre ?? ''}`).join(', ') || '—',
                  },
                  { key: 'metodo', label: 'Método', render: (v: any) => <span className="capitalize">{v.metodo_pago}</span> },
                  { key: 'total', label: 'Total', render: (v: any) => <span className="font-semibold tabular-nums">S/ {Number(v.total).toFixed(2)}</span> },
                ]}
                rows={data?.ventas ?? []}
                getKey={(v: any) => v.id}
                emptyText="Sin compras de productos"
              />
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground py-6 text-center">Sin datos</p>
        )}
      </DialogContent>
    </Dialog>
  )
}
