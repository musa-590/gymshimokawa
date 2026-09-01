import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus, Trash2 } from 'lucide-react'
import { listarUsuarios, crearUsuario, actualizarUsuario, eliminarUsuarioDefinitivo, obtenerRoles } from '@/lib/api/usuarios'
import { useUserRole } from '@/hooks/use-user-role'
import type { Usuario } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const estadoBadge = {
  activo: 'success' as const,
  inactivo: 'destructive' as const,
  suspendido: 'warning' as const,
}

const estadoLabel = { activo: 'Activo', inactivo: 'Inactivo', suspendido: 'Suspendido' }

interface FormValues {
  nombre: string
  email: string
  telefono?: string
  rol_id: string
  password?: string
}

export function UsuariosPage() {
  const { data: rol, isLoading: rolLoading } = useUserRole()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [eliminando, setEliminando] = useState<Usuario | null>(null)

  const { data: usuarios, isLoading } = useQuery({
    queryKey: ['usuarios', search],
    queryFn: () => listarUsuarios(search || undefined),
    enabled: rol === 'admin',
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarUsuarioDefinitivo(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Usuario eliminado definitivamente')
      setEliminando(null)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  if (rolLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-yellow-400 border-t-transparent" />
      </div>
    )
  }

  if (rol !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
        <p className="text-lg font-medium">Acceso denegado</p>
        <p className="text-sm">Solo los administradores pueden ver esta sección.</p>
      </div>
    )
  }

  const columns: Column<Usuario>[] = [
    { key: 'nombre', label: 'Nombre', render: (u) => <span className="font-medium">{u.nombre}</span> },
    { key: 'email', label: 'Email', render: (u) => u.email, hideInCard: true },
    { key: 'telefono', label: 'Teléfono', render: (u) => u.telefono ?? '—', hideInCard: true },
    {
      key: 'rol',
      label: 'Rol',
      render: (u) => <Badge variant="outline">{u.rol?.nombre ?? '—'}</Badge>,
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (u) => <Badge variant={estadoBadge[u.estado]}>{estadoLabel[u.estado]}</Badge>,
    },
    {
      key: 'ultimo_acceso',
      label: 'Último acceso',
      render: (u) => u.ultimo_acceso
        ? new Date(u.ultimo_acceso).toLocaleDateString('es-PE')
        : 'Nunca',
      hideInCard: true,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestiona los usuarios del sistema</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
          <Plus /> Nuevo usuario
        </Button>
      </div>

      <Input
        placeholder="Buscar por nombre o email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-xs"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
          <CardDescription>{usuarios?.length ?? 0} usuarios</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={columns}
              rows={usuarios ?? []}
              getKey={(u) => u.id}
              emptyText="No hay usuarios"
              onEdit={(u) => { setEditando(u); setModalOpen(true) }}
              onDelete={(u) => setEliminando(u)}
            />
          )}
        </CardContent>
      </Card>

      <UsuarioDialog open={modalOpen} onOpenChange={setModalOpen} usuario={editando} />

      <Dialog open={!!eliminando} onOpenChange={() => setEliminando(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="h-5 w-5" />
              Eliminar usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar definitivamente a <strong>{eliminando?.nombre}</strong>?
              Esta acción no se puede deshacer. Se eliminará su cuenta de autenticación y todos sus datos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEliminando(null)}>Cancelar</Button>
            <Button
              variant="destructive"
              disabled={eliminarMutation.isPending}
              onClick={() => eliminando && eliminarMutation.mutate(eliminando.id)}
            >
              {eliminarMutation.isPending ? 'Eliminando...' : 'Eliminar definitivamente'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UsuarioDialog({
  open, onOpenChange, usuario,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  usuario: Usuario | null
}) {
  const queryClient = useQueryClient()
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>()

  const { data: roles } = useQuery({
    queryKey: ['roles'],
    queryFn: obtenerRoles,
    enabled: open,
  })

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      if (usuario) {
        const { email: _, password: __, ...rest } = data
        return actualizarUsuario(usuario.id, {
          ...rest,
          telefono: rest.telefono || undefined,
        })
      }
      return crearUsuario({
        ...data,
        telefono: data.telefono || undefined,
        password: data.password!,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success(usuario ? 'Usuario actualizado' : 'Usuario creado')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{usuario ? 'Editar usuario' : 'Nuevo usuario'}</DialogTitle>
          <DialogDescription>Completa los datos del usuario.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre completo</Label>
            <Input id="nombre" defaultValue={usuario?.nombre ?? ''} {...register('nombre', { required: 'El nombre es obligatorio' })} />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" defaultValue={usuario?.email ?? ''} disabled={!!usuario} {...register('email', { required: 'El email es obligatorio' })} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          {!usuario && (
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input id="password" type="password" {...register('password', { required: 'La contraseña es obligatoria', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" defaultValue={usuario?.telefono ?? ''} {...register('telefono')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol_id">Rol</Label>
              <Select
                defaultValue={usuario?.rol_id ?? undefined}
                onValueChange={(v) => register('rol_id').onChange({ target: { value: v } })}
              >
                <SelectTrigger id="rol_id">
                  <SelectValue placeholder="Seleccionar rol" />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : usuario ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
