import supabase from '../supabase'

export async function obtenerClientesReporte(tipo?: string) {
  let query = supabase.from('clientes')
    .select('*, tipo_membresia:tipos_membresia(nombre)')
    .order('created_at', { ascending: false })
  if (tipo === 'activos') query = query.eq('estado', 'activo')
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function obtenerCajasReporte(fechaDesde: string, fechaHasta: string) {
  const { data, error } = await supabase.from('cajas')
    .select('*').gte('fecha_apertura', fechaDesde)
    .lte('fecha_apertura', `${fechaHasta}T23:59:59`)
    .order('fecha_apertura', { ascending: false })
  if (error) throw error
  return data
}

export async function obtenerVentasReporte(fechaDesde: string, fechaHasta: string) {
  const { data, error } = await supabase.from('ventas')
    .select('*, cliente:clientes(nombre, dni), detalles:detalle_ventas(*, producto:productos(nombre))')
    .gte('created_at', fechaDesde).lte('created_at', `${fechaHasta}T23:59:59`)
  if (error) throw error
  return data
}

export async function obtenerPagosMembresiaReporte(fechaDesde: string, fechaHasta: string) {
  const { data, error } = await supabase.from('pagos_membresia')
    .select('*, cliente:clientes(nombre, dni), tipo_membresia:tipos_membresia(nombre)')
    .gte('created_at', fechaDesde).lte('created_at', `${fechaHasta}T23:59:59`)
  if (error) throw error
  return data
}

export async function obtenerEstadisticasDashboard() {
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()
  const hace7Dias = new Date(Date.now() - 6 * 86400000).toISOString()
  const hoy = new Date().toISOString()

  const [clientes, personal, productos, caja, fiados, clientesMes, ventasMes, membresiasMes, egresosMes, ventasHoy, ventas7dias, membresias7dias] = await Promise.all([
    supabase.from('clientes').select('id', { count: 'exact', head: true }),
    supabase.from('personal').select('id', { count: 'exact', head: true }),
    supabase.from('productos').select('id', { count: 'exact', head: true }),
    supabase.from('cajas').select('*').eq('estado', 'abierta').maybeSingle(),
    supabase.from('fiados').select('*, clientes(nombre, dni)').eq('estado', 'pendiente').order('created_at', { ascending: false }),
    supabase.from('clientes').select('created_at').gte('created_at', inicioMes),
    supabase.from('ventas').select('total').gte('created_at', inicioMes),
    supabase.from('pagos_membresia').select('monto_final').gte('created_at', inicioMes),
    supabase.from('egresos').select('monto').gte('created_at', inicioMes),
    supabase.from('ventas').select('total').gte('created_at', hoy),
    supabase.from('ventas').select('total, created_at').gte('created_at', hace7Dias),
    supabase.from('pagos_membresia').select('monto_final, created_at').gte('created_at', hace7Dias),
  ])

  const resultados = [clientes, personal, productos, caja, fiados, clientesMes, ventasMes, membresiasMes, egresosMes, ventasHoy, ventas7dias, membresias7dias]
  const errores = resultados.filter(r => r.error)
  if (errores.length) throw errores[0].error

  const porDia = (rows: { total?: number; monto_final?: number; created_at: string }[]) => {
    const map = new Map<string, number>()
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000)
      map.set(d.toISOString().slice(0, 10), 0)
    }
    for (const r of rows) {
      const k = r.created_at.slice(0, 10)
      if (map.has(k)) map.set(k, map.get(k)! + Number(r.total ?? r.monto_final ?? 0))
    }
    return [...map.entries()].map(([k, v]) => ({
      label: new Date(`${k}T00:00:00`).toLocaleDateString('es-PE', { weekday: 'short' }).replace('.', ''),
      value: v,
    }))
  }

  return {
    totalClientes: clientes.count ?? 0,
    totalPersonal: personal.count ?? 0,
    totalProductos: productos.count ?? 0,
    cajaAbierta: caja.data,
    fiadosPendientes: fiados.data,
    nuevosClientesMes: clientesMes.data?.length ?? 0,
    ventasMes: (ventasMes.data ?? []).reduce((s, v) => s + Number(v.total), 0),
    membresiasMes: (membresiasMes.data ?? []).reduce((s, v) => s + Number(v.monto_final), 0),
    egresosMes: (egresosMes.data ?? []).reduce((s, v) => s + Number(v.monto), 0),
    ventasHoy: (ventasHoy.data ?? []).reduce((s, v) => s + Number(v.total), 0),
    ventasPorDia: porDia(ventas7dias.data ?? []),
    membresiasPorDia: porDia(membresias7dias.data ?? []),
  }
}

export async function obtenerRecordatorios() {
  const [membresias, cumpleanos, fiados] = await Promise.all([
    supabase.from('v_membresias_por_vencer').select('*').order('dias_restantes', { ascending: true }),
    supabase.from('v_cumpleanos_proximos').select('*').order('proximo_cumpleanos', { ascending: true }),
    supabase.from('fiados').select('*, cliente:clientes(nombre, dni, telefono)')
      .eq('estado', 'pendiente').order('fecha_limite', { ascending: true }),
  ])
  return {
    membresiasPorVencer: membresias.data ?? [],
    cumpleanosProximos: cumpleanos.data ?? [],
    fiadosPendientes: fiados.data ?? [],
  }
}
