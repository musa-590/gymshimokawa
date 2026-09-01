import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Gift, ImagePlus, Loader2, Plus, X } from 'lucide-react'
import {
  listarDescuentos, crearDescuento, actualizarDescuento, eliminarDescuento, subirImagenPromocion,
} from '@/lib/api/descuentos'
import type { Descuento } from '@/lib/types'
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

interface FormValues {
  nombre: string
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number
  descripcion?: string
  activo?: boolean
}

export function PromocionesPage() {
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Descuento | null>(null)

  const { data: descuentos, isLoading } = useQuery({
    queryKey: ['descuentos'],
    queryFn: listarDescuentos,
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarDescuento(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descuentos'] })
      toast.success('Promoción eliminada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Descuento>[] = [
    {
      key: 'nombre',
      label: 'Nombre',
      render: (d) => (
        <span className="font-medium inline-flex items-center gap-2">
          {d.imagen_url && (
            <img src={d.imagen_url} alt="" className="h-7 w-7 rounded object-cover" />
          )}
          {d.nombre}
        </span>
      ),
    },
    { key: 'tipo', label: 'Tipo', render: (d) => d.tipo === 'porcentaje' ? 'Porcentaje' : 'Monto fijo' },
    {
      key: 'valor',
      label: 'Valor',
      render: (d) => (
        <span className="font-bold text-yellow-600">
          {d.tipo === 'porcentaje' ? `${d.valor}%` : `S/ ${d.valor.toFixed(2)}`}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (d) => d.activo ? <Badge variant="success">Activa</Badge> : <Badge variant="destructive">Inactiva</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Promociones</h1>
          <p className="text-sm text-muted-foreground">Descuentos para clientes</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
          <Plus /> Nueva promoción
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Descuentos</CardTitle>
          <CardDescription>{descuentos?.length ?? 0} promociones</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={columns}
              rows={descuentos ?? []}
              getKey={(d) => d.id}
              emptyText="No hay promociones"
              onEdit={(d) => { setEditando(d); setModalOpen(true) }}
              onDelete={(d) => eliminarMutation.mutate(d.id)}
            />
          )}
        </CardContent>
      </Card>

      <DescuentoDialog open={modalOpen} onOpenChange={setModalOpen} descuento={editando} />
    </div>
  )
}

function DescuentoDialog({
  open, onOpenChange, descuento,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  descuento: Descuento | null
}) {
  const queryClient = useQueryClient()
  const [tipo, setTipo] = useState<'porcentaje' | 'monto_fijo'>(descuento?.tipo ?? 'porcentaje')
  const [imagenUrl, setImagenUrl] = useState<string>(descuento?.imagen_url ?? '')
  const [subiendo, setSubiendo] = useState(false)
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>()

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        descripcion: data.descripcion || undefined,
        imagen_url: imagenUrl || undefined,
        activo: data.activo ?? true,
      }
      return descuento
        ? actualizarDescuento(descuento.id, payload)
        : crearDescuento(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['descuentos'] })
      toast.success(descuento ? 'Promoción actualizada' : 'Promoción creada')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const handleArchivo = async (file?: File) => {
    if (!file) return
    if (!['image/png', 'image/jpeg', 'image/jpg', 'video/mp4'].includes(file.type)) {
      toast.error('Solo PNG, JPG o MP4')
      return
    }
    if (file.size > 50 * 1024 * 1024) {
      toast.error('Máximo 50MB')
      return
    }
    setSubiendo(true)
    try {
      setImagenUrl(await subirImagenPromocion(file))
    } catch (e: any) {
      toast.error(e.message ?? 'Error al subir archivo')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{descuento ? 'Editar promoción' : 'Nueva promoción'}</DialogTitle>
          <DialogDescription>Define el tipo y valor del descuento.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" defaultValue={descuento?.nombre ?? ''} placeholder="Ej: Descuento de Bienvenida" {...register('nombre', { required: 'El nombre es obligatorio' })} />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              rows={2}
              defaultValue={descuento?.descripcion ?? ''}
              placeholder="Ej: Válido solo para productos de suplementación"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('descripcion')}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagen o video</Label>
            {imagenUrl ? (
              <div className="relative">
                {imagenUrl.endsWith('.mp4') ? (
                  <video src={imagenUrl} className="max-h-36 rounded-lg" controls />
                ) : (
                  <img src={imagenUrl} alt="Promoción" className="max-h-36 rounded-lg object-cover" />
                )}
                <button
                  type="button"
                  onClick={() => setImagenUrl('')}
                  className="absolute -top-2 -right-2 rounded-full bg-destructive p-1 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-sm text-muted-foreground hover:bg-accent">
                {subiendo ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                {subiendo ? 'Subiendo archivo...' : 'Subir imagen o video (PNG/JPG/MP4, máx 50MB)'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,video/mp4"
                  className="hidden"
                  disabled={subiendo}
                  onChange={(e) => handleArchivo(e.target.files?.[0])}
                />
              </label>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de descuento</Label>
              <Select
                value={tipo}
                onValueChange={(v) => setTipo(v as 'porcentaje' | 'monto_fijo')}
              >
                <SelectTrigger id="tipo"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="porcentaje">Porcentaje (%)</SelectItem>
                  <SelectItem value="monto_fijo">Monto fijo (S/)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="valor">Valor</Label>
              <Input
                id="valor"
                type="number"
                step={tipo === 'porcentaje' ? 1 : 0.01}
                max={tipo === 'porcentaje' ? 100 : undefined}
                defaultValue={descuento?.valor ?? 0}
                {...register('valor', { required: true, valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })}
              />
              {errors.valor && <p className="text-sm text-destructive">{errors.valor.message}</p>}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              defaultChecked={descuento?.activo ?? true}
              className="h-4 w-4 rounded border-input accent-yellow-500"
              {...register('activo')}
            />
            Activa
          </label>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending || subiendo}>
              {mutation.isPending ? 'Guardando...' : descuento ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export { Gift }
