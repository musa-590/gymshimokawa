import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Star, Globe, Trash2 } from 'lucide-react'
import {
  listarClientes, crearCliente, actualizarCliente, eliminarCliente, eliminarClienteDefinitivo, verificarDniDisponible, verificarCarnetDisponible,
} from '@/lib/api/clientes'
import { listarTiposMembresia } from '@/lib/api/membresias'
import { listarDescuentos } from '@/lib/api/descuentos'
import type { Cliente, ClienteFormData, ClienteEstado } from '@/lib/types'
import { useSupabase } from '@/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'
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

interface FormValues {
  nombre: string
  dni: string
  es_extranjero?: boolean
  carnet_extranjeria?: string
  telefono?: string
  fecha_cumpleanos?: string
  tipo_membresia_id?: string
  descuento_id?: string
  es_vip?: boolean
  estado?: string
  fecha_vencimiento_membresia?: string
}

export function ClientesPage() {
  const { user } = useSupabase()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')
  const [filtroVip, setFiltroVip] = useState<boolean>(false)
  const [page, setPage] = useState(1)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Cliente | null>(null)
  const [eliminando, setEliminando] = useState<Cliente | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['clientes', search, filtroEstado, filtroVip, page],
    queryFn: () =>
      listarClientes({
        search: search || undefined,
        estado: filtroEstado === 'todos' ? undefined : (filtroEstado as Cliente['estado']),
        es_vip: filtroVip ? true : undefined,
        page,
        pageSize: PAGE_SIZE,
      }),
  })
  const clientes = data?.data ?? []
  const total = data?.count ?? 0

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

function ClienteDialog({
  open, onOpenChange, cliente, userId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  userId: string
}) {
  const queryClient = useQueryClient()
  const {
    register, handleSubmit, reset, watch, formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      es_extranjero: cliente?.es_extranjero ?? false,
    },
  })
  const esExtranjero = watch('es_extranjero')

  const { data: tipos } = useQuery({
    queryKey: ['tipos-membresia-activos'],
    queryFn: () => listarTiposMembresia(true),
    enabled: open,
  })
  const { data: descuentos } = useQuery({
    queryKey: ['descuentos'],
    queryFn: listarDescuentos,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: async (data: FormValues) => {
      if (data.es_extranjero) {
        if (!data.carnet_extranjeria) throw new Error('El carné de extranjería es obligatorio')
        const disponible = await verificarCarnetDisponible(data.carnet_extranjeria, cliente?.id)
        if (!disponible) throw new Error('El carné de extranjería ya está registrado')
      } else {
        if (!data.dni) throw new Error('El DNI es obligatorio')
        const disponible = await verificarDniDisponible(data.dni, cliente?.id)
        if (!disponible) throw new Error('El DNI ya está registrado')
      }
      const { es_extranjero, carnet_extranjeria, dni, ...rest } = data
      const payload: ClienteFormData = {
        ...rest,
        es_extranjero: es_extranjero ?? false,
        carnet_extranjeria: es_extranjero ? (carnet_extranjeria || undefined) : undefined,
        dni: es_extranjero ? '' : dni,
        es_vip: rest.es_vip ?? false,
        estado: rest.estado as ClienteEstado | undefined,
      }
      if (cliente) {
        return actualizarCliente(cliente.id, payload)
      }
      return crearCliente({
        ...payload,
        registrado_por: userId,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(cliente ? 'Cliente actualizado' : 'Cliente creado')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{cliente ? 'Editar cliente' : 'Nuevo cliente'}</DialogTitle>
          <DialogDescription>
            Completa los datos del cliente para {cliente ? 'actualizarlo' : 'registrarlo'}.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input
              id="nombre"
              defaultValue={cliente?.nombre ?? ''}
              placeholder="Ej: Juan Pérez"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={cliente?.es_extranjero ?? false}
              className="h-4 w-4 rounded border-input accent-yellow-500"
              {...register('es_extranjero')}
            />
            <span className="inline-flex items-center gap-1">
              <Globe className="h-4 w-4 text-blue-500" /> Es extranjero
            </span>
          </label>

          {esExtranjero ? (
            <div className="space-y-2">
              <Label htmlFor="carnet_extranjeria">Carné de Extranjería</Label>
              <Input
                id="carnet_extranjeria"
                defaultValue={cliente?.carnet_extranjeria ?? ''}
                placeholder="Solo números"
                disabled={!!cliente}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault() }}
                {...register('carnet_extranjeria', esExtranjero ? { required: 'El carné de extranjería es obligatorio', pattern: { value: /^\d+$/, message: 'Solo se permiten números' } } : undefined)}
              />
              {errors.carnet_extranjeria && <p className="text-sm text-destructive">{errors.carnet_extranjeria.message}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="dni">DNI</Label>
              <Input
                id="dni"
                defaultValue={cliente?.dni ?? ''}
                placeholder="8 dígitos"
                disabled={!!cliente}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault() }}
                {...register('dni', { required: 'El DNI es obligatorio', pattern: { value: /^\d{8}$/, message: 'El DNI debe tener 8 dígitos' } })}
              />
              {errors.dni && <p className="text-sm text-destructive">{errors.dni.message}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                defaultValue={cliente?.telefono ?? ''}
                placeholder="Solo números"
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={(e) => { if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault() }}
                {...register('telefono')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_cumpleanos">Fecha de cumpleaños</Label>
              <Input
                id="fecha_cumpleanos"
                type="date"
                defaultValue={cliente?.fecha_cumpleanos?.split('T')[0] ?? ''}
                {...register('fecha_cumpleanos')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_membresia_id">Tipo de membresía</Label>
              <Select
                value={cliente?.tipo_membresia_id ?? undefined}
                onValueChange={(v) => register('tipo_membresia_id').onChange({ target: { value: v === 'none' ? undefined : v } })}
              >
                <SelectTrigger id="tipo_membresia_id">
                  <SelectValue placeholder="Sin membresía" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin membresía</SelectItem>
                  {tipos?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.nombre} - S/ {t.precio.toFixed(2)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="descuento_id">Descuento</Label>
              <Select
                value={cliente?.descuento_id ?? undefined}
                onValueChange={(v) => register('descuento_id').onChange({ target: { value: v === 'none' ? undefined : v } })}
              >
                <SelectTrigger id="descuento_id">
                  <SelectValue placeholder="Sin descuento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin descuento</SelectItem>
                  {descuentos?.filter((d: any) => d.activo).map((d: any) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.nombre} - {d.tipo === 'porcentaje' ? `${d.valor}%` : `S/ ${d.valor.toFixed(2)}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          {cliente && (
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Select
                value={cliente?.estado ?? 'activo'}
                onValueChange={(v) => register('estado').onChange({ target: { value: v } })}
              >
                <SelectTrigger id="estado">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="activo">Activo</SelectItem>
                  <SelectItem value="por_vencer">Por vencer</SelectItem>
                  <SelectItem value="inactivo">Inactivo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={cliente?.es_vip ?? false}
              className="h-4 w-4 rounded border-input accent-yellow-500"
              {...register('es_vip')}
            />
            <span className="inline-flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" /> Cliente VIP
            </span>
          </label>
          {cliente && (
            <div className="space-y-2">
              <Label htmlFor="fecha_vencimiento_membresia">Fecha de vencimiento de membresía</Label>
              <Input
                id="fecha_vencimiento_membresia"
                type="date"
                defaultValue={cliente?.fecha_vencimiento_membresia?.split('T')[0] ?? ''}
                {...register('fecha_vencimiento_membresia')}
              />
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : cliente ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
