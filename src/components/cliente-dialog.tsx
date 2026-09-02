import { useEffect } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Star, Globe } from 'lucide-react'
import {
  crearCliente, actualizarCliente, verificarDniDisponible, verificarCarnetDisponible,
} from '@/lib/api/clientes'
import { listarTiposMembresia } from '@/lib/api/membresias'
import { listarDescuentos } from '@/lib/api/descuentos'
import type { Cliente, ClienteFormData, ClienteEstado } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

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

export function ClienteDialog({
  open, onOpenChange, cliente, userId, initial, onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  cliente: Cliente | null
  userId: string
  initial?: { nombre?: string; dni?: string; carnet?: string; es_extranjero?: boolean }
  onCreated?: (cliente: Cliente) => void
}) {
  const queryClient = useQueryClient()

  const defaults: FormValues = cliente ? {
    nombre: cliente.nombre,
    dni: cliente.dni,
    es_extranjero: cliente.es_extranjero,
    carnet_extranjeria: cliente.carnet_extranjeria ?? '',
    telefono: cliente.telefono ?? '',
    fecha_cumpleanos: cliente.fecha_cumpleanos?.split('T')[0] ?? '',
    tipo_membresia_id: cliente.tipo_membresia_id ?? '',
    descuento_id: cliente.descuento_id ?? '',
    es_vip: cliente.es_vip,
    estado: cliente.estado,
    fecha_vencimiento_membresia: cliente.fecha_vencimiento_membresia?.split('T')[0] ?? '',
  } : {
    nombre: initial?.nombre ?? '',
    dni: initial?.dni ?? '',
    es_extranjero: initial?.es_extranjero ?? false,
    carnet_extranjeria: initial?.carnet ?? '',
    telefono: '',
    fecha_cumpleanos: '',
    tipo_membresia_id: '',
    descuento_id: '',
    es_vip: false,
    estado: 'activo',
    fecha_vencimiento_membresia: '',
  }

  const {
    register, handleSubmit, reset, watch, control, formState: { errors },
  } = useForm<FormValues>({ defaultValues: defaults })

  useEffect(() => {
    if (open) reset(defaults)
  }, [open])

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
        tipo_membresia_id: rest.tipo_membresia_id || undefined,
        descuento_id: rest.descuento_id || undefined,
        fecha_cumpleanos: rest.fecha_cumpleanos || null,
        fecha_vencimiento_membresia: rest.fecha_vencimiento_membresia || null,
      }
      if (cliente) return actualizarCliente(cliente.id, payload)
      return crearCliente({ ...payload, registrado_por: userId })
    },
    onSuccess: (creado) => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success(cliente ? 'Cliente actualizado' : 'Cliente creado')
      onOpenChange(false)
      reset()
      if (!cliente) onCreated?.(creado)
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const numeroSolo = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!/[0-9]/.test(e.key) && !['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault()
  }

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
            <Label htmlFor="nombre">Nombre completo *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Juan Pérez"
              {...register('nombre', { required: 'El nombre es obligatorio' })}
            />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-input accent-yellow-500"
              {...register('es_extranjero')}
            />
            <span className="inline-flex items-center gap-1">
              <Globe className="h-4 w-4 text-blue-500" /> Es extranjero
            </span>
          </label>

          {esExtranjero ? (
            <div className="space-y-2">
              <Label htmlFor="carnet_extranjeria">Carné de Extranjería *</Label>
              <Input
                id="carnet_extranjeria"
                placeholder="Solo números"
                disabled={!!cliente}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={numeroSolo}
                {...register('carnet_extranjeria', esExtranjero ? { required: 'El carné de extranjería es obligatorio', pattern: { value: /^\d+$/, message: 'Solo se permiten números' } } : undefined)}
              />
              {errors.carnet_extranjeria && <p className="text-sm text-destructive">{errors.carnet_extranjeria.message}</p>}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="dni">DNI *</Label>
              <Input
                id="dni"
                placeholder="8 dígitos"
                disabled={!!cliente}
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={numeroSolo}
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
                placeholder="Solo números"
                inputMode="numeric"
                pattern="[0-9]*"
                onKeyDown={numeroSolo}
                {...register('telefono')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha_cumpleanos">Fecha de cumpleaños</Label>
              <Input
                id="fecha_cumpleanos"
                type="date"
                {...register('fecha_cumpleanos')}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo_membresia_id">Tipo de membresía {!cliente && '*'}</Label>
              <Controller
                name="tipo_membresia_id"
                control={control}
                rules={{ required: cliente ? false : 'El tipo de membresía es obligatorio' }}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
                  >
                    <SelectTrigger id="tipo_membresia_id">
                      <SelectValue placeholder="Selecciona un tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {cliente && <SelectItem value="none">Sin membresía</SelectItem>}
                      {tipos?.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.nombre} - S/ {t.precio.toFixed(2)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipo_membresia_id && <p className="text-sm text-destructive">{errors.tipo_membresia_id.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="descuento_id">Descuento</Label>
              <Controller
                name="descuento_id"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value || undefined}
                    onValueChange={(v) => field.onChange(v === 'none' ? '' : v)}
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
                )}
              />
            </div>
          </div>
          {cliente && (
            <div className="space-y-2">
              <Label htmlFor="estado">Estado</Label>
              <Controller
                name="estado"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="estado">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="activo">Activo</SelectItem>
                      <SelectItem value="por_vencer">Por vencer</SelectItem>
                      <SelectItem value="inactivo">Inactivo</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
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