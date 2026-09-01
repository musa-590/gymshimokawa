import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Plus } from 'lucide-react'
import {
  listarEgresos, crearEgreso, actualizarEgreso, eliminarEgreso, listarCategoriasEgresos, listarPersonalEgresos,
} from '@/lib/api/egresos'
import { useSupabase } from '@/providers/supabase-provider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable, type Column } from '@/components/crud-table'
import { Pagination } from '@/components/ui/pagination'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const PAGE_SIZE = 15
const METODOS_PAGO = ['efectivo', 'transferencia', 'yape', 'plin', 'tarjeta', 'otro']

interface FormValues {
  categoria_id: string
  monto: number
  descripcion: string
  fecha: string
  metodo_pago?: string
  notas?: string
  personal_id?: string
}

export function EgresosPage() {
  const { user } = useSupabase()
  const queryClient = useQueryClient()
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState<any>(null)
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['egresos', filtroCategoria, page],
    queryFn: () =>
      listarEgresos({
        categoriaId: filtroCategoria === 'todas' ? undefined : filtroCategoria,
        page,
        pageSize: PAGE_SIZE,
      }),
  })
  const egresos = data?.data ?? []
  const total = data?.count ?? 0

  const { data: categorias } = useQuery({
    queryKey: ['categorias-egresos'],
    queryFn: listarCategoriasEgresos,
  })

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarEgreso(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
      toast.success('Egreso eliminado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const columns: Column<any>[] = [
    {
      key: 'fecha',
      label: 'Fecha',
      render: (e) => new Date(e.fecha).toLocaleDateString('es-PE'),
    },
    {
      key: 'categoria',
      label: 'Categoría',
      render: (e) => (
        <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
          {e.categoria?.nombre ?? '—'}
        </span>
      ),
    },
    { key: 'descripcion', label: 'Descripción', render: (e) => e.descripcion },
    {
      key: 'metodo_pago',
      label: 'Método',
      render: (e) => e.metodo_pago ? <span className="capitalize">{e.metodo_pago}</span> : '—',
    },
    {
      key: 'monto',
      label: 'Monto',
      render: (e) => <span className="font-bold text-destructive">- S/ {Number(e.monto).toFixed(2)}</span>,
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Egresos</h1>
          <p className="text-sm text-muted-foreground">Gastos del gimnasio</p>
        </div>
        <Button onClick={() => { setEditando(null); setModalOpen(true) }}>
          <Plus /> Nuevo egreso
        </Button>
      </div>

      {categorias && categorias.length > 0 && (
        <Select value={filtroCategoria} onValueChange={(v) => { setFiltroCategoria(v); setPage(1) }}>
          <SelectTrigger className="w-52">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas las categorías</SelectItem>
            {categorias.map((c: any) => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Listado</CardTitle>
          <CardDescription>{total} egresos</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <>
              <CrudTable
                columns={columns}
                rows={egresos}
                getKey={(e) => e.id}
                emptyText="No hay egresos"
                onEdit={(e) => { setEditando(e); setModalOpen(true) }}
                onDelete={(e) => eliminarMutation.mutate(e.id)}
              />
              <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>

      <EgresoDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        egreso={editando}
        categorias={categorias ?? []}
        usuarioId={user?.id ?? ''}
      />
    </div>
  )
}

function EgresoDialog({
  open, onOpenChange, egreso, categorias, usuarioId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  egreso: any | null
  categorias: any[]
  usuarioId: string
}) {
  const queryClient = useQueryClient()
  const [categoriaId, setCategoriaId] = useState<string>(egreso?.categoria_id ?? '')
  const [metodoPago, setMetodoPago] = useState<string>(egreso?.metodo_pago ?? 'efectivo')
  const {
    register, handleSubmit, reset, formState: { errors },
  } = useForm<FormValues>()

  const { data: personal } = useQuery({
    queryKey: ['personal-egresos'],
    queryFn: listarPersonalEgresos,
    enabled: open,
  })

  const categoria = categorias.find((c: any) => c.id === categoriaId)
  const esPagoPersonal = categoria?.nombre?.toLowerCase() === 'pagos a personal'

  const mutation = useMutation({
    mutationFn: (data: FormValues) => {
      const hoy = new Date().toISOString().split('T')[0]
      const payload: any = {
        categoria_id: data.categoria_id,
        monto: data.monto,
        descripcion: data.descripcion,
        fecha: data.fecha || hoy,
        metodo_pago: metodoPago,
        notas: data.notas || undefined,
        personal_id: esPagoPersonal ? data.personal_id || undefined : undefined,
        usuario_id: usuarioId,
      }
      return egreso
        ? actualizarEgreso(egreso.id, payload)
        : crearEgreso(payload)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['egresos'] })
      toast.success(egreso ? 'Egreso actualizado' : 'Egreso registrado')
      onOpenChange(false)
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{egreso ? 'Editar egreso' : 'Nuevo egreso'}</DialogTitle>
          <DialogDescription>Registra un gasto del gimnasio.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((data) => mutation.mutate(data))} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="categoria_id">Categoría</Label>
            <Select
              value={categoriaId}
              onValueChange={(v) => {
                setCategoriaId(v)
                register('categoria_id').onChange({ target: { value: v } })
              }}
            >
              <SelectTrigger id="categoria_id">
                <SelectValue placeholder="Selecciona categoría" />
              </SelectTrigger>
              <SelectContent>
                {categorias.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!categoriaId && <p className="text-sm text-destructive">Selecciona una categoría</p>}
          </div>

          {esPagoPersonal && (
            <div className="space-y-2">
              <Label htmlFor="personal_id">Personal</Label>
              <Select
                value={egreso?.personal_id ?? undefined}
                onValueChange={(v) => register('personal_id').onChange({ target: { value: v } })}
              >
                <SelectTrigger id="personal_id">
                  <SelectValue placeholder="Selecciona personal" />
                </SelectTrigger>
                <SelectContent>
                  {personal?.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre} - {p.dni}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="monto">Monto (S/)</Label>
              <Input
                id="monto" type="number" step="0.01" defaultValue={egreso?.monto ?? 0}
                {...register('monto', { required: true, valueAsNumber: true, min: { value: 0.01, message: 'Monto inválido' } })}
              />
              {errors.monto && <p className="text-sm text-destructive">{errors.monto.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha</Label>
              <Input id="fecha" type="date" defaultValue={egreso?.fecha?.split('T')[0] ?? ''} {...register('fecha')} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Input id="descripcion" defaultValue={egreso?.descripcion ?? ''} {...register('descripcion', { required: 'La descripción es obligatoria' })} />
            {errors.descripcion && <p className="text-sm text-destructive">{errors.descripcion.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="metodo_pago">Método de pago</Label>
            <Select value={metodoPago} onValueChange={setMetodoPago}>
              <SelectTrigger id="metodo_pago">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METODOS_PAGO.map((m) => (
                  <SelectItem key={m} value={m}><span className="capitalize">{m}</span></SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notas">Notas</Label>
            <textarea
              id="notas"
              rows={3}
              defaultValue={egreso?.notas ?? ''}
              placeholder="Notas adicionales (opcional)"
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              {...register('notas')}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={mutation.isPending || !categoriaId}>
              {mutation.isPending ? 'Guardando...' : egreso ? 'Actualizar' : 'Registrar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
