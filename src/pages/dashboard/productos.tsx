import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import { listarProductos, crearProducto, actualizarProducto, eliminarProducto } from '@/lib/api/productos'
import type { Producto } from '@/lib/types'
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

const CATEGORIAS = ['Suplementos', 'Ropa', 'Accesorios', 'Equipo', 'Hidratación', 'Comidas Fit', 'Postres Fit']

interface FormValues {
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  stock_minimo?: number
  categoria?: string
  aplica_descuento?: boolean
  activo?: boolean
}

export function ProductosPage() {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<Producto | null>(null)

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos', search, filtroCategoria],
    queryFn: () =>
      listarProductos({
        search: search || undefined,
        categoria: filtroCategoria === 'todas' ? undefined : filtroCategoria,
      }),
  })

  const categorias = [...new Set(productos?.map((p) => p.categoria).filter(Boolean) as string[])]

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarProducto(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      toast.success('Producto desactivado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<Producto>[] = [
    { key: 'nombre', label: 'Nombre', render: (p) => <span className="font-medium">{p.nombre}</span> },
    { key: 'categoria', label: 'Categoría', render: (p) => p.categoria ?? '—' },
    { key: 'precio', label: 'Precio', render: (p) => `S/ ${p.precio.toFixed(2)}` },
    {
      key: 'stock',
      label: 'Stock',
      render: (p) => (
        <span className={p.stock <= p.stock_minimo ? 'text-destructive font-semibold' : ''}>
          {p.stock}
          {p.stock <= p.stock_minimo && ' (mínimo)'}
        </span>
      ),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (p) => p.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="destructive">Inactivo</Badge>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">Inventario con control de stock</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
          <Plus /> Nuevo producto
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar producto..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        {categorias.length > 0 && (
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Inventario</CardTitle>
          <CardDescription>{productos?.length ?? 0} productos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={columns}
              rows={productos ?? []}
              getKey={(p) => p.id}
              emptyText="No hay productos"
              onEdit={(p) => { setEditando(p); setModalOpen(true) }}
              onDelete={(p) => eliminarMutation.mutate(p.id)}
            />
          )}
        </CardContent>
      </Card>

      <ProductoDialog open={modalOpen} onOpenChange={setModalOpen} producto={editando} />
    </div>
  )
}

function ProductoDialog({
  open, onOpenChange, producto,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  producto: Producto | null
}) {
  const queryClient = useQueryClient()
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>()

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const payload = {
        ...data,
        descripcion: data.descripcion || undefined,
        categoria: data.categoria || undefined,
        stock_minimo: data.stock_minimo ?? 5,
        aplica_descuento: data.aplica_descuento ?? false,
      }
      return producto
        ? actualizarProducto(producto.id, { ...payload, activo: data.activo ?? true })
        : crearProducto(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['productos'] })
      toast.success(producto ? 'Producto actualizado' : 'Producto creado')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{producto ? 'Editar producto' : 'Nuevo producto'}</DialogTitle>
          <DialogDescription>Completa los datos del producto.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre</Label>
            <Input id="nombre" defaultValue={producto?.nombre ?? ''} {...register('nombre', { required: 'El nombre es obligatorio' })} />
            {errors.nombre && <p className="text-sm text-destructive">{errors.nombre.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="precio">Precio (S/)</Label>
              <Input
                id="precio" type="number" step="0.01" defaultValue={producto?.precio ?? 0}
                {...register('precio', { required: true, valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })}
              />
              {errors.precio && <p className="text-sm text-destructive">{errors.precio.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock" type="number" defaultValue={producto?.stock ?? 0}
                {...register('stock', { required: true, valueAsNumber: true, min: { value: 0, message: 'No puede ser negativo' } })}
              />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock.message}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_minimo">Stock mínimo</Label>
              <Input id="stock_minimo" type="number" defaultValue={producto?.stock_minimo ?? 5} {...register('stock_minimo', { valueAsNumber: true })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="categoria">Categoría</Label>
              <Select
                value={producto?.categoria ?? undefined}
                onValueChange={(v) => register('categoria').onChange({ target: { value: v } })}
              >
                <SelectTrigger id="categoria">
                  <SelectValue placeholder="Seleccionar" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              id="descripcion"
              rows={2}
              defaultValue={producto?.descripcion ?? ''}
              placeholder="Opcional"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('descripcion')}
            />
          </div>
          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={producto?.aplica_descuento ?? false}
                className="h-4 w-4 rounded border-input accent-yellow-500"
                {...register('aplica_descuento')}
              />
              Aplica descuento
            </label>
            {producto && (
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  defaultChecked={producto?.activo ?? true}
                  className="h-4 w-4 rounded border-input accent-yellow-500"
                  {...register('activo')}
                />
                Activo
              </label>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando...' : producto ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
