import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { listarPersonal, crearPersonal, actualizarPersonal, eliminarPersonal } from '@/lib/api/personal'
import type { Personal } from '@/lib/types'
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
  dni: string
  telefono?: string
  cargo?: string
  fecha_ingreso?: string
}

export function PersonalPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Personal | null>(null)
  const [eliminando, setEliminando] = useState<Personal | null>(null)

  const { data: personal, isLoading } = useQuery({
    queryKey: ['personal', search],
    queryFn: () => listarPersonal(search || undefined),
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarPersonal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] })
      toast.success('Personal eliminado')
      setEliminando(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Personal>[] = [
    { key: 'nombre', label: 'Nombre', render: (p) => <span className="font-medium">{p.nombre}</span> },
    { key: 'dni', label: 'DNI', render: (p) => p.dni },
    { key: 'telefono', label: 'Teléfono', render: (p) => p.telefono ?? '—' },
    { key: 'cargo', label: 'Cargo', render: (p) => p.cargo ?? '—' },
    {
      key: 'fecha_ingreso',
      label: 'Fecha ingreso',
      render: (p) => p.fecha_ingreso ? new Date(p.fecha_ingreso).toLocaleDateString('es-PE') : '—',
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => p.estado === 'activo'
        ? <Badge variant="success">Activo</Badge>
        : <Badge variant="destructive">Inactivo</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Personal</h1>
          <p className="text-sm text-muted-foreground">Trabajadores del gimnasio</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
          <Plus /> Nuevo personal
        </Button>
      </div>

      <Input
        placeholder="Buscar por nombre o DNI..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
          <CardDescription>{personal?.length ?? 0} trabajadores</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={columns}
              rows={personal ?? []}
              getKey={(p) => p.id}
              emptyText="No hay personal"
              onEdit={(p) => { setEditando(p); setModalOpen(true) }}
              onDelete={(p) => setEliminando(p)}
            />
          )}
        </CardContent>
      </Card>

      <PersonalDialog open={modalOpen} onOpenChange={setModalOpen} persona={editando} />

      <Dialog open={!!eliminando} onOpenChange={(o) => !o && setEliminando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar personal</DialogTitle>
            <DialogDescription>
              ¿Seguro que deseas eliminar a <strong>{eliminando?.nombre}</strong>? Se eliminarán también sus registros de asistencia y egresos. Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminando(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => eliminando && eliminarMutation.mutate(eliminando.id)}
              disabled={eliminarMutation.isPending}
            >
              {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PersonalDialog({
  open, onOpenChange, persona,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  persona: Personal | null
}) {
  const queryClient = useQueryClient()
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>()

  const mutation = useMutation({
    mutationFn: (data: FormValues) =>
      persona
        ? actualizarPersonal(persona.id, { ...data, telefono: data.telefono || undefined, cargo: data.cargo || undefined, fecha_ingreso: data.fecha_ingreso || undefined })
        : crearPersonal({ ...data, telefono: data.telefono || undefined, cargo: data.cargo || undefined, fecha_ingreso: data.fecha_ingreso || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personal'] })
      toast.success(persona ? 'Personal actualizado' : 'Personal creado')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{persona ? 'Editar personal' : 'Nuevo personal'}</DialogTitle>
          <DialogDescription>Completa los datos del trabajador.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" defaultValue={persona?.nombre ?? ''} {...register('nombre', { required: 'El nombre es obligatorio' })} />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="dni">DNI</Label>
            <Input
              id="dni" defaultValue={persona?.dni ?? ''}
              {...register('dni', { required: 'El DNI es obligatorio', pattern: { value: /^\d{8}$/, message: 'El DNI debe tener 8 dígitos' } })}
            />
            {errors.dni && <p className="text-sm text-destructive">{errors.dni.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" defaultValue={persona?.telefono ?? ''} {...register('telefono')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cargo">Cargo</Label>
              <Input id="cargo" defaultValue={persona?.cargo ?? ''} placeholder="Ej: Recepcionista" {...register('cargo')} />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="fecha_ingreso">Fecha de ingreso</Label>
            <Input id="fecha_ingreso" type="date" defaultValue={persona?.fecha_ingreso ?? ''} {...register('fecha_ingreso')} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : persona ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
