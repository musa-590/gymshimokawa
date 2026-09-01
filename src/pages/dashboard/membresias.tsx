import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { CalendarDays, Plus } from 'lucide-react'
import {
  listarTiposMembresia, crearTipoMembresia, actualizarTipoMembresia, eliminarTipoMembresia,
  listarPagosMembresia,
} from '@/lib/api/membresias'
import type { TipoMembresia } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'

interface FormValues {
  nombre: string
  duracion_dias: number
  precio: number
  descripcion?: string
  activo?: boolean
}

export function MembresiasPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<TipoMembresia | null>(null)

  const { data: tipos, isLoading } = useQuery({
    queryKey: ['tipos-membresia'],
    queryFn: () => listarTiposMembresia(),
  })

  const { data: pagos } = useQuery({
    queryKey: ['pagos-membresia'],
    queryFn: () => listarPagosMembresia(20),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarTipoMembresia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-membresia'] })
      toast.success('Tipo de membresía eliminado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const tipoColumns: Column<TipoMembresia>[] = [
    { key: 'nombre', label: 'Nombre', render: (t) => <span className="font-medium">{t.nombre}</span> },
    {
      key: 'duracion',
      label: 'Duración',
      render: (t) => (
        <span className="inline-flex items-center gap-1">
          <CalendarDays size={14} /> {t.duracion_dias} días
        </span>
      ),
    },
    { key: 'precio', label: 'Precio', render: (t) => `S/ ${t.precio.toFixed(2)}` },
    {
      key: 'estado',
      label: 'Estado',
      render: (t) => t.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>,
    },
  ]

  const pagoColumns: Column<any>[] = [
    { key: 'cliente', label: 'Cliente', render: (p) => <span className="font-medium">{p.clientes?.nombre ?? '—'}</span> },
    { key: 'membresia', label: 'Membresía', render: (p) => p.tipos_membresia?.nombre ?? '—' },
    { key: 'monto', label: 'Monto', render: (p) => `S/ ${Number(p.monto_final ?? 0).toFixed(2)}` },
    {
      key: 'vence',
      label: 'Vence',
      render: (p) => new Date(p.fecha_vencimiento).toLocaleDateString('es-PE'),
    },
    { key: 'pago', label: 'Pago', render: (p) => <span className="capitalize">{p.metodo_pago}</span> },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membresías</h1>
          <p className="text-sm text-muted-foreground">Tipos de membresía y pagos registrados</p>
        </div>
        <Button
          onClick={() => {
            setEditando(null)
            setModalOpen(true)
          }}
        >
          <Plus /> Nuevo tipo
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tipos de membresía</CardTitle>
          <CardDescription>Duración y precio de cada plan</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={tipoColumns}
              rows={tipos ?? []}
              getKey={(t) => t.id}
              emptyText="No hay tipos de membresía"
              onEdit={(t) => { setEditando(t); setModalOpen(true) }}
              onDelete={(t) => eliminarMutation.mutate(t.id)}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimos pagos</CardTitle>
          <CardDescription>Pagos recientes de membresías</CardDescription>
        </CardHeader>
        <CardContent>
          {!pagos?.length ? (
            <p className="text-muted-foreground py-6 text-center">Sin pagos registrados</p>
          ) : (
            <CrudTable
              columns={pagoColumns}
              rows={pagos ?? []}
              getKey={(p) => p.id}
              emptyText="Sin pagos registrados"
            />
          )}
        </CardContent>
      </Card>

      <TipoMembresiaDialog open={modalOpen} onOpenChange={setModalOpen} tipo={editando} />
    </div>
  )
}

function TipoMembresiaDialog({
  open, onOpenChange, tipo,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  tipo: TipoMembresia | null
}) {
  const queryClient = useQueryClient()
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>()

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      tipo
        ? actualizarTipoMembresia(tipo.id, {
            ...data,
            descripcion: data.descripcion || null,
            activo: data.activo ?? true,
          })
        : crearTipoMembresia({ ...data, descripcion: data.descripcion || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tipos-membresia'] })
      toast.success(tipo ? 'Tipo actualizado' : 'Tipo creado')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{tipo ? 'Editar tipo de membresía' : 'Nuevo tipo de membresía'}</DialogTitle>
          <DialogDescription>Define duración y precio del plan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" defaultValue={tipo?.nombre ?? ''} placeholder="Ej: Mensual" {...register('nombre', { required: 'El nombre es obligatorio' })} />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duracion_dias">Duración (días)</Label>
              <Input
                id="duracion_dias" type="number" defaultValue={tipo?.duracion_dias ?? 30}
                {...register('duracion_dias', { required: true, valueAsNumber: true, min: { value: 1, message: 'Mínimo 1 día' } })}
              />
              {errors.duracion_dias && <p className="text-sm text-destructive">{errors.duracion_dias.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (S/)</Label>
              <Input
                id="precio" type="number" step="0.01" defaultValue={tipo?.precio ?? 0}
                {...register('precio', { required: true, valueAsNumber: true, min: { value: 0, message: 'El precio no puede ser negativo' } })}
              />
              {errors.precio && <p className="text-sm text-destructive">{errors.precio.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              rows={2}
              defaultValue={tipo?.descripcion ?? ''}
              placeholder="Opcional"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('descripcion')}
            />
          </div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={tipo?.activo ?? true}
              className="h-4 w-4 rounded border-input accent-yellow-500"
              {...register('activo')}
            />
            Activo
          </label>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : tipo ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
