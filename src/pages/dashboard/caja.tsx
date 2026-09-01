import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { Banknote, History, Minus, Plus, Search, ShoppingCart } from 'lucide-react'
import {
  obtenerCajaAbierta, abrirCaja, cerrarCaja, listarHistorialCajas, obtenerDetalleCaja,
} from '@/lib/api/caja'
import { crearVenta } from '@/lib/api/ventas'
import { buscarProductosVenta } from '@/lib/api/productos'
import { listarTiposMembresia, crearPagoMembresia } from '@/lib/api/membresias'
import { listarClientes, buscarClientesPorCampo } from '@/lib/api/clientes'
import { listarFiados, crearFiado, pagarFiado, anularFiado } from '@/lib/api/fiados'
import supabase from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CrudTable } from '@/components/crud-table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import * as Tabs from '@radix-ui/react-tabs'

interface CarritoItem {
  producto_id: string
  nombre: string
  cantidad: number
  precio_unitario: number
}

interface FiadoForm {
  cliente_id: string
  fecha_limite: string
  observacion?: string
}

export function CajaPage() {
  const queryClient = useQueryClient()
  const [montoInicial, setMontoInicial] = useState(0)
  const [cajaOpen, setCajaOpen] = useState(false)

  const { data: caja } = useQuery({
    queryKey: ['caja-abierta'],
    queryFn: obtenerCajaAbierta,
  })

  const abrirMutation = useMutation({
    mutationFn: () => abrirCaja(montoInicial),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-abierta'] })
      toast.success('Caja abierta')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const cerrarMutation = useMutation({
    mutationFn: () => cerrarCaja(caja!.id, { monto_final: 0 }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['caja-abierta'] })
      toast.success('Caja cerrada')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Caja</h1>
          <p className="text-sm text-muted-foreground">Ventas, membresías y fiados</p>
        </div>
        {caja ? (
          <Badge variant="success" className="text-sm px-3 py-1">Caja abierta</Badge>
        ) : (
          <Badge variant="destructive" className="text-sm px-3 py-1">Caja cerrada</Badge>
        )}
      </div>

      <Tabs.Root defaultValue="operaciones">
        <Tabs.List className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
          <Tabs.Trigger
            value="operaciones"
            className="inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          >
            Operaciones
          </Tabs.Trigger>
          <Tabs.Trigger
            value="historial"
            className="inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
          >
            Historial
          </Tabs.Trigger>
        </Tabs.List>

        <div className="mt-4">
          <Tabs.Content value="operaciones">
            {!caja ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Abrir caja</CardTitle>
                  <CardDescription>Ingresa el monto inicial para iniciar operaciones</CardDescription>
                </CardHeader>
                <CardContent className="flex gap-3">
                  <Input
                    type="number" step="0.01" placeholder="Monto inicial (S/)"
                    value={montoInicial}
                    onChange={(e) => setMontoInicial(Number(e.target.value))}
                    className="max-w-xs"
                  />
                  <Button onClick={() => abrirMutation.mutate()} disabled={abrirMutation.isPending}>
                    <Banknote /> Abrir caja
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base">Caja abierta desde {new Date(caja.fecha_apertura).toLocaleTimeString('es-PE')}</CardTitle>
                      <CardDescription>Monto inicial: S/ {caja.monto_inicial.toFixed(2)}</CardDescription>
                    </div>
                    <Button variant="destructive" onClick={() => setCajaOpen(true)}>Cerrar caja</Button>
                  </CardHeader>
                </Card>

                <Tabs.Root defaultValue="ventas">
                  <Tabs.List className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground">
                    {[
                      { v: 'ventas', l: 'Venta de productos' },
                      { v: 'membresias', l: 'Venta de membresía' },
                      { v: 'fiados', l: 'Fiados' },
                    ].map((t) => (
                      <Tabs.Trigger
                        key={t.v}
                        value={t.v}
                        className="inline-flex items-center justify-center rounded-sm px-3 py-1.5 text-sm font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow"
                      >
                        {t.l}
                      </Tabs.Trigger>
                    ))}
                  </Tabs.List>

                  <div className="mt-4">
                    <Tabs.Content value="ventas">
                      <VentaProductos cajaId={caja.id} />
                    </Tabs.Content>
                    <Tabs.Content value="membresias">
                      <VentaMembresia cajaId={caja.id} />
                    </Tabs.Content>
                    <Tabs.Content value="fiados">
                      <Fiados cajaId={caja.id} />
                    </Tabs.Content>
                  </div>
                </Tabs.Root>
              </div>
            )}
          </Tabs.Content>

          <Tabs.Content value="historial">
            <HistorialCajas />
          </Tabs.Content>
        </div>
      </Tabs.Root>

      <CerrarCajaDialog
        open={cajaOpen}
        onOpenChange={setCajaOpen}
        caja={caja ?? null}
        onConfirm={() => cerrarMutation.mutate()}
        loading={cerrarMutation.isPending}
      />
    </div>
  )
}

function VentaProductos({ cajaId }: { cajaId: string }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [clienteId, setClienteId] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [buscarPor, setBuscarPor] = useState<BuscarPor>('nombre')
  const [showClientes, setShowClientes] = useState(false)

  const { data: clientesBuscados } = useQuery({
    queryKey: ['clientes-buscar-venta', buscarPor, clienteSearch],
    queryFn: async () => {
      if (!clienteSearch.trim()) return []
      return buscarClientesPorCampo(buscarPor, clienteSearch.trim())
    },
    enabled: clienteSearch.trim().length >= 1,
  })

  const clienteSeleccionado = clientesBuscados?.find((c) => c.id === clienteId)

  const handleSearchChange = (value: string) => {
    if (buscarPor === 'nombre') setClienteSearch(value)
    else setClienteSearch(value.replace(/\D/g, ''))
  }

  const { data: resultados } = useQuery({
    queryKey: ['buscar-productos', search],
    queryFn: () => buscarProductosVenta(search),
    enabled: search.length >= 2,
  })

  const ventaMutation = useMutation({
    mutationFn: () => {
      const subtotal = carrito.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0)
      return crearVenta({
        caja_id: cajaId,
        cliente_id: clienteId || undefined,
        subtotal,
        descuento_aplicado: 0,
        total: subtotal,
        metodo_pago: 'efectivo',
        items: carrito.map(({ producto_id, cantidad, precio_unitario }) => ({ producto_id, cantidad, precio_unitario })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buscar-productos'] })
      toast.success('Venta registrada')
      setCarrito([])
      setClienteId('')
      setClienteSearch('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const total = carrito.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Buscar productos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Cliente (opcional)</Label>
            <div className="flex gap-2">
              <Select value={buscarPor} onValueChange={(v) => { setBuscarPor(v as BuscarPor); setClienteSearch(''); setClienteId('') }}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="nombre">Nombre</SelectItem>
                  <SelectItem value="dni">DNI</SelectItem>
                  <SelectItem value="carnet">Carnet</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={clienteSeleccionado ? `${clienteSeleccionado.nombre} (${clienteSeleccionado.dni})` : `Buscar por ${buscarPor}...`}
                  value={clienteId
                    ? (buscarPor === 'nombre' ? clienteSeleccionado?.nombre ?? '' : buscarPor === 'dni' ? clienteSeleccionado?.dni ?? '' : clienteSeleccionado?.carnet_extranjeria ?? '')
                    : clienteSearch}
                  onChange={(e) => { setClienteId(''); handleSearchChange(e.target.value); setShowClientes(true) }}
                  onFocus={() => setShowClientes(true)}
                  onBlur={() => setTimeout(() => setShowClientes(false), 200)}
                  className="pl-9"
                />
                {clienteId && (
                  <button type="button" onClick={() => { setClienteId(''); setClienteSearch('') }} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">✕</button>
                )}
              </div>
            </div>
            {showClientes && !clienteId && clienteSearch.length >= 1 && (
              <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md max-h-48 overflow-auto">
                {clientesBuscados?.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
                ) : (
                  clientesBuscados?.map((c) => (
                    <button key={c.id} type="button"
                      className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex justify-between"
                      onMouseDown={() => { setClienteId(c.id); setShowClientes(false) }}>
                      <span className="font-medium">{c.nombre}</span>
                      <span className="text-muted-foreground">DNI: {c.dni}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {resultados?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="font-medium text-sm">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">S/ {p.precio.toFixed(2)} · stock {p.stock}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const existente = carrito.find((it) => it.producto_id === p.id)
                  if (existente) {
                    setCarrito(carrito.map((it) => it.producto_id === p.id ? { ...it, cantidad: it.cantidad + 1 } : it))
                  } else {
                    setCarrito([...carrito, { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: p.precio }])
                  }
                }}
              >
                <Plus /> Agregar
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingCart className="h-4 w-4" /> Carrito
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {!carrito.length ? (
            <p className="text-muted-foreground py-6 text-center">Carrito vacío</p>
          ) : (
            carrito.map((it) => (
              <div key={it.producto_id} className="flex items-center justify-between rounded-md border px-3 py-2">
                <div>
                  <p className="font-medium text-sm">{it.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    S/ {it.precio_unitario.toFixed(2)} × {it.cantidad}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="icon" variant="outline" className="h-7 w-7"
                    onClick={() => setCarrito(carrito.map((x) => x.producto_id === it.producto_id ? { ...x, cantidad: x.cantidad - 1 } : x).filter((x) => x.cantidad > 0))}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="text-sm font-semibold w-6 text-center">{it.cantidad}</span>
                  <Button
                    size="icon" variant="outline" className="h-7 w-7"
                    onClick={() => setCarrito(carrito.map((x) => x.producto_id === it.producto_id ? { ...x, cantidad: x.cantidad + 1 } : x))}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
          {carrito.length > 0 && (
            <>
              <div className="flex justify-between pt-2 font-semibold">
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <Button className="w-full" onClick={() => ventaMutation.mutate()} disabled={ventaMutation.isPending}>
                {ventaMutation.isPending ? 'Registrando...' : `Cobrar S/ ${total.toFixed(2)}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

type BuscarPor = 'nombre' | 'dni' | 'carnet'

function VentaMembresia({ cajaId }: { cajaId: string }) {
  const queryClient = useQueryClient()
  const [clienteId, setClienteId] = useState('')
  const [clienteSearch, setClienteSearch] = useState('')
  const [buscarPor, setBuscarPor] = useState<BuscarPor>('nombre')
  const [tipoId, setTipoId] = useState('')
  const [showClientes, setShowClientes] = useState(false)

  const { data: clientes } = useQuery({
    queryKey: ['clientes-buscar', buscarPor, clienteSearch],
    queryFn: async () => {
      if (!clienteSearch.trim()) return []
      return buscarClientesPorCampo(buscarPor, clienteSearch.trim())
    },
    enabled: clienteSearch.trim().length >= 1,
  })

  const clienteSeleccionado = clientes?.find((c) => c.id === clienteId)

  const diasRestantes = (() => {
    if (!clienteSeleccionado?.fecha_vencimiento_membresia) return 0
    const venc = new Date(clienteSeleccionado.fecha_vencimiento_membresia)
    const hoy = new Date()
    const diff = Math.ceil((venc.getTime() - hoy.getTime()) / 86400000)
    return diff > 0 ? diff : 0
  })()

  const { data: tipos } = useQuery({
    queryKey: ['tipos-membresia-activos'],
    queryFn: () => listarTiposMembresia(true),
  })

  const placeholder = buscarPor === 'nombre'
    ? 'Escribir nombre...'
    : buscarPor === 'dni'
      ? 'Solo números...'
      : 'Solo números...'

  const handleSearchChange = (value: string) => {
    if (buscarPor === 'nombre') {
      setClienteSearch(value)
    } else {
      setClienteSearch(value.replace(/\D/g, ''))
    }
  }

  const pagoMutation = useMutation({
    mutationFn: async () => {
      if (!clienteId || !tipoId) throw new Error('Debe seleccionar cliente y tipo de membresía')
      const tipo = tipos!.find((t) => t.id === tipoId)!
      const hoy = new Date()
      const totalDias = tipo.duracion_dias + diasRestantes
      const vencimiento = new Date(hoy.getTime() + totalDias * 86400000)

      await crearPagoMembresia({
        caja_id: cajaId,
        cliente_id: clienteId,
        tipo_membresia_id: tipoId,
        monto_base: tipo.precio,
        monto_final: tipo.precio,
        metodo_pago: 'efectivo',
        fecha_inicio: hoy.toISOString(),
        fecha_vencimiento: vencimiento.toISOString(),
      })

      const nuevoEstado = 'activo' as const
      const patch: Record<string, unknown> = { estado: nuevoEstado }
      patch.fecha_vencimiento_membresia = vencimiento.toISOString()
      patch.tipo_membresia_id = tipoId
      patch.fecha_inicio_membresia = hoy.toISOString()

      const { error } = await supabase.from('clientes').update(patch).eq('id', clienteId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientes'] })
      toast.success('Membresía vendida')
      setClienteId('')
      setClienteSearch('')
      setTipoId('')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vender membresía</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label>Buscar cliente por</Label>
          <Select value={buscarPor} onValueChange={(v) => { setBuscarPor(v as BuscarPor); setClienteSearch(''); setClienteId('') }}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="nombre">Nombre</SelectItem>
              <SelectItem value="dni">DNI</SelectItem>
              <SelectItem value="carnet">Carnet de extranjería</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 relative">
          <Label>{buscarPor === 'nombre' ? 'Nombre' : buscarPor === 'dni' ? 'DNI' : 'Carnet de extranjería'}</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={clienteSeleccionado ? `${clienteSeleccionado.nombre} (${buscarPor === 'dni' ? clienteSeleccionado.dni : buscarPor === 'carnet' ? clienteSeleccionado.carnet_extranjeria ?? '' : clienteSeleccionado.dni})` : placeholder}
              value={clienteId
                ? (buscarPor === 'nombre' ? clienteSeleccionado?.nombre ?? '' : buscarPor === 'dni' ? clienteSeleccionado?.dni ?? '' : clienteSeleccionado?.carnet_extranjeria ?? '')
                : clienteSearch}
              onChange={(e) => {
                setClienteId('')
                handleSearchChange(e.target.value)
                setShowClientes(true)
              }}
              onFocus={() => setShowClientes(true)}
              onBlur={() => setTimeout(() => setShowClientes(false), 200)}
              className="pl-9"
            />
            {clienteId && (
              <button
                type="button"
                onClick={() => { setClienteId(''); setClienteSearch('') }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            )}
          </div>
          {showClientes && !clienteId && clienteSearch.length >= 1 && (
            <div className="absolute z-50 w-full mt-1 rounded-md border bg-popover text-popover-foreground shadow-md max-h-60 overflow-auto">
              {clientes?.length === 0 ? (
                <div className="px-3 py-2 text-sm text-muted-foreground">Sin resultados</div>
              ) : (
                clientes?.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground flex justify-between"
                    onMouseDown={() => {
                      setClienteId(c.id)
                      setClienteSearch('')
                      setShowClientes(false)
                    }}
                  >
                    <span className="font-medium">{c.nombre}</span>
                    <span className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        c.estado === 'activo' ? 'bg-green-500/20 text-green-400' :
                        c.estado === 'por_vencer' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {c.estado === 'activo' ? 'Activo' : c.estado === 'por_vencer' ? 'Por vencer' : 'Inactivo'}
                      </span>
                      <span className="text-muted-foreground">
                        {buscarPor === 'dni' ? `DNI: ${c.dni}` : buscarPor === 'carnet' ? `Carnet: ${c.carnet_extranjeria ?? '—'}` : `DNI: ${c.dni}`}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label>Tipo de membresía</Label>
          <Select value={tipoId} onValueChange={setTipoId}>
            <SelectTrigger><SelectValue placeholder="Selecciona plan" /></SelectTrigger>
            <SelectContent>
              {tipos?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.nombre} · {t.duracion_dias} días · S/ {t.precio.toFixed(2)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {clienteSeleccionado && diasRestantes > 0 && (
          <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/30 p-3 text-sm">
            <p className="text-yellow-400 font-medium">
              Este cliente tiene {diasRestantes} día{diasRestantes !== 1 ? 's' : ''} restante{diasRestantes !== 1 ? 's' : ''} de su membresía actual.
            </p>
            <p className="text-muted-foreground mt-1">
              Se sumarán al nuevo plan: {tipoId ? `${(tipos?.find((t) => t.id === tipoId)?.duracion_dias ?? 0) + diasRestantes} días totales` : 'Seleccioná un plan para ver el total'}
            </p>
          </div>
        )}
        {clienteSeleccionado && clienteSeleccionado.estado === 'inactivo' && (
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 text-sm">
            <p className="text-blue-400 font-medium">
              Este cliente está inactivo. Al comprar una membresía, su estado cambiará a ACTIVO automáticamente.
            </p>
          </div>
        )}
        <Button onClick={() => pagoMutation.mutate()} disabled={pagoMutation.isPending || !clienteId || !tipoId}>
          {pagoMutation.isPending ? 'Registrando...' : 'Cobrar membresía'}
        </Button>
      </CardContent>
    </Card>
  )
}

function Fiados({ cajaId }: { cajaId: string }) {
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const { register, handleSubmit, reset } = useForm<FiadoForm>()

  const { data: fiados } = useQuery({
    queryKey: ['fiados'],
    queryFn: () => listarFiados('pendiente'),
  })

  const { data: clientes } = useQuery({
    queryKey: ['clientes-fiado'],
    queryFn: async () => (await listarClientes({ estado: 'activo' })).data,
  })

  const { data: resultados } = useQuery({
    queryKey: ['buscar-productos-fiado', search],
    queryFn: () => buscarProductosVenta(search),
    enabled: search.length >= 2,
  })

  const crearMutation = useMutation({
    mutationFn: (data: FiadoForm) => {
      const total = carrito.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0)
      return crearFiado({
        cliente_id: data.cliente_id,
        caja_id: cajaId,
        monto_total: total,
        metodo_pago: 'efectivo',
        fecha_limite: data.fecha_limite,
        observaciones: data.observacion,
        items: carrito.map(({ producto_id, cantidad, precio_unitario }) => ({ producto_id, cantidad, precio_unitario })),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiados'] })
      toast.success('Fiado creado')
      setCarrito([])
      reset()
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const pagarMutation = useMutation({
    mutationFn: ({ id, saldo }: { id: string; saldo: number }) => pagarFiado(id, saldo),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiados'] })
      toast.success('Fiado pagado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const anularMutation = useMutation({
    mutationFn: (id: string) => anularFiado(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiados'] })
      toast.success('Fiado anulado')
    },
    onError: (e: Error) => toast.error(e.message),
  })

  const total = carrito.reduce((acc, it) => acc + it.cantidad * it.precio_unitario, 0)

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nuevo fiado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Cliente</Label>
            <Select onValueChange={(v) => register('cliente_id').onChange({ target: { value: v } })}>
              <SelectTrigger><SelectValue placeholder="Selecciona cliente" /></SelectTrigger>
              <SelectContent>
                {clientes?.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.nombre} ({c.dni})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Agregar productos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {resultados?.map((p: any) => (
            <div key={p.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <p className="font-medium text-sm">{p.nombre}</p>
                <p className="text-xs text-muted-foreground">S/ {p.precio.toFixed(2)}</p>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  const existente = carrito.find((it) => it.producto_id === p.id)
                  if (existente) {
                    setCarrito(carrito.map((it) => it.producto_id === p.id ? { ...it, cantidad: it.cantidad + 1 } : it))
                  } else {
                    setCarrito([...carrito, { producto_id: p.id, nombre: p.nombre, cantidad: 1, precio_unitario: p.precio }])
                  }
                }}
              >
                <Plus /> Agregar
              </Button>
            </div>
          ))}
          {carrito.length > 0 && (
            <>
              <div className="space-y-1">
                {carrito.map((it) => (
                  <div key={it.producto_id} className="flex justify-between text-sm">
                    <span>{it.nombre} × {it.cantidad}</span>
                    <span>S/ {(it.cantidad * it.precio_unitario).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total</span>
                <span>S/ {total.toFixed(2)}</span>
              </div>
              <div className="space-y-2">
                <Label htmlFor="fecha_limite">Fecha límite</Label>
                <Input id="fecha_limite" type="date" {...register('fecha_limite', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacion">Observación</Label>
                <Input id="observacion" {...register('observacion')} />
              </div>
              <Button className="w-full" onClick={handleSubmit((d) => crearMutation.mutate(d))} disabled={crearMutation.isPending}>
                {crearMutation.isPending ? 'Creando...' : `Crear fiado S/ ${total.toFixed(2)}`}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fiados pendientes</CardTitle>
          <CardDescription>{fiados?.length ?? 0} por cobrar</CardDescription>
        </CardHeader>
        <CardContent>
          {!fiados?.length ? (
            <p className="text-muted-foreground py-6 text-center">Sin fiados pendientes</p>
          ) : (
            <CrudTable
              columns={[
                { key: 'cliente', label: 'Cliente', render: (f: any) => <span className="font-medium">{f.cliente?.nombre ?? '—'}</span> },
                { key: 'total', label: 'Total', render: (f: any) => `S/ ${Number(f.monto_total).toFixed(2)}` },
                {
                  key: 'saldo',
                  label: 'Saldo',
                  render: (f: any) => (
                    <span className="font-semibold text-destructive">
                      S/ {(Number(f.monto_total) - Number(f.monto_pagado ?? 0)).toFixed(2)}
                    </span>
                  ),
                },
              ]}
              rows={fiados ?? []}
              getKey={(f: any) => f.id}
              emptyText="Sin fiados pendientes"
              renderActions={(f: any) => {
                const saldo = Number(f.monto_total) - Number(f.monto_pagado ?? 0)
                return (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => pagarMutation.mutate({ id: f.id, saldo })} disabled={pagarMutation.isPending}>
                      Cobrar
                    </Button>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => anularMutation.mutate(f.id)}>
                      Anular
                    </Button>
                  </div>
                )
              }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function CerrarCajaDialog({
  open, onOpenChange, caja, onConfirm, loading,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  caja: any | null
  onConfirm: () => void
  loading: boolean
}) {
  if (!open || !caja) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-xl bg-background p-6 space-y-4">
        <h2 className="text-lg font-semibold">Cerrar caja</h2>
        <p className="text-sm text-muted-foreground">
          Se cerrará la caja abierta a las {new Date(caja.fecha_apertura).toLocaleTimeString('es-PE')} con monto inicial de S/ {caja.monto_inicial.toFixed(2)}.
        </p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? 'Cerrando...' : 'Cerrar caja'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function HistorialCajas() {
  const [detalle, setDetalle] = useState<any | null>(null)

  const { data: historial, isLoading } = useQuery({
    queryKey: ['historial-cajas'],
    queryFn: () => listarHistorialCajas(30),
  })

  const { data: detalleData, isLoading: detalleLoading } = useQuery({
    queryKey: ['detalle-caja', detalle?.id],
    queryFn: () => (detalle ? obtenerDetalleCaja(detalle.id) : Promise.resolve(null)),
    enabled: !!detalle,
  })

  const metodoResumen = (items: any[]) => {
    const grupos: Record<string, number> = {}
    items.forEach((i) => {
      grupos[i.metodo_pago] = (grupos[i.metodo_pago] ?? 0) + Number(i.monto_final ?? i.total ?? 0)
    })
    return grupos
  }

  const columns = [
    {
      key: 'apertura',
      label: 'Apertura',
      render: (c: any) => new Date(c.fecha_apertura).toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
    },
    {
      key: 'estado',
      label: 'Estado',
      render: (c: any) => c.estado === 'abierta'
        ? <Badge variant="success">Abierta</Badge>
        : <Badge variant="secondary">Cerrada</Badge>,
    },
    { key: 'inicial', label: 'Monto inicial', render: (c: any) => <span className="tabular-nums">S/ {Number(c.monto_inicial).toFixed(2)}</span> },
    { key: 'ventas', label: 'Ventas', render: (c: any) => <span className="tabular-nums">S/ {Number(c.total_ventas_productos ?? 0).toFixed(2)}</span> },
    { key: 'membresias', label: 'Membresías', render: (c: any) => <span className="tabular-nums">S/ {Number(c.total_membresias ?? 0).toFixed(2)}</span> },
    { key: 'ingresos', label: 'Total', render: (c: any) => <span className="font-semibold tabular-nums">S/ {Number(c.total_ingresos ?? 0).toFixed(2)}</span> },
  ]

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-4 w-4" /> Historial de cajas
          </CardTitle>
          <CardDescription>Últimas 30 cierres de caja</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground py-8 text-center">Cargando...</p>
          ) : (
            <CrudTable
              columns={columns}
              rows={historial ?? []}
              getKey={(c: any) => c.id}
              emptyText="Sin cajas registradas"
              onRowClick={setDetalle}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={!!detalle} onOpenChange={(o) => !o && setDetalle(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Caja del {detalle ? new Date(detalle.fecha_apertura).toLocaleDateString('es-PE') : ''}
            </DialogTitle>
            <DialogDescription>
              {detalle?.estado === 'abierta' ? 'Caja abierta' : 'Caja cerrada'} · {detalle?.observaciones || 'Sin observaciones'}
            </DialogDescription>
          </DialogHeader>
          {detalleLoading ? (
            <p className="text-muted-foreground py-6 text-center">Cargando detalle...</p>
          ) : detalleData ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-muted-foreground text-xs">Monto inicial</p>
                  <p className="font-semibold">S/ {Number(detalle.monto_inicial).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-muted-foreground text-xs">Ventas</p>
                  <p className="font-semibold">S/ {Number(detalle.total_ventas_productos ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-muted-foreground text-xs">Membresías</p>
                  <p className="font-semibold">S/ {Number(detalle.total_membresias ?? 0).toFixed(2)}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-muted-foreground text-xs">Total ingresos</p>
                  <p className="font-semibold">S/ {Number(detalle.total_ingresos ?? 0).toFixed(2)}</p>
                </div>
              </div>

              {(() => {
                const ventas = detalleData.ventas ?? []
                const pagos = detalleData.pagos_membresia ?? []
                const resVentas = metodoResumen(ventas)
                const resPagos = metodoResumen(pagos)
                return (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-2">Ventas por método</p>
                      {Object.entries(resVentas).length === 0 ? (
                        <p className="text-sm">Sin ventas</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(resVentas).map(([m, v]) => (
                            <div key={m} className="flex justify-between text-sm capitalize">
                              <span>{m}</span><span className="font-medium tabular-nums">S/ {v.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="rounded-lg border p-3">
                      <p className="text-xs text-muted-foreground mb-2">Membresías por método</p>
                      {Object.entries(resPagos).length === 0 ? (
                        <p className="text-sm">Sin membresías</p>
                      ) : (
                        <div className="space-y-1">
                          {Object.entries(resPagos).map(([m, v]) => (
                            <div key={m} className="flex justify-between text-sm capitalize">
                              <span>{m}</span><span className="font-medium tabular-nums">S/ {v.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}

              <div>
                <p className="text-sm font-semibold mb-2">Ventas de productos ({detalleData.ventas?.length ?? 0})</p>
                <CrudTable
                  columns={[
                    {
                      key: 'hora',
                      label: 'Hora',
                      render: (v: any) => new Date(v.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                    },
                    { key: 'cliente', label: 'Cliente', render: (v: any) => v.clientes?.nombre ?? 'Sin cliente' },
                    {
                      key: 'productos',
                      label: 'Productos',
                      render: (v: any) => (v.detalle_ventas ?? []).map((d: any) => `${d.cantidad}x ${d.productos?.nombre ?? ''}`).join(', ') || '—',
                    },
                    { key: 'metodo', label: 'Método', render: (v: any) => <span className="capitalize">{v.metodo_pago}</span> },
                    { key: 'total', label: 'Total', render: (v: any) => <span className="font-semibold tabular-nums">S/ {Number(v.total).toFixed(2)}</span> },
                  ]}
                  rows={detalleData.ventas ?? []}
                  getKey={(v: any) => v.id}
                  emptyText="Sin ventas"
                />
              </div>
              <div>
                <p className="text-sm font-semibold mb-2">Membresías vendidas ({detalleData.pagos_membresia?.length ?? 0})</p>
                <CrudTable
                  columns={[
                    {
                      key: 'hora',
                      label: 'Hora',
                      render: (p: any) => new Date(p.created_at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }),
                    },
                    { key: 'cliente', label: 'Cliente', render: (p: any) => p.clientes?.nombre },
                    { key: 'plan', label: 'Plan', render: (p: any) => p.tipos_membresia?.nombre ?? '—' },
                    {
                      key: 'vence',
                      label: 'Vencimiento',
                      render: (p: any) => new Date(p.fecha_vencimiento).toLocaleDateString('es-PE'),
                    },
                    { key: 'metodo', label: 'Método', render: (p: any) => <span className="capitalize">{p.metodo_pago}</span> },
                    { key: 'monto', label: 'Monto', render: (p: any) => <span className="font-semibold tabular-nums">S/ {Number(p.monto_final).toFixed(2)}</span> },
                  ]}
                  rows={detalleData.pagos_membresia ?? []}
                  getKey={(p: any) => p.id}
                  emptyText="Sin membresías"
                />
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground py-6 text-center">Sin datos</p>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
