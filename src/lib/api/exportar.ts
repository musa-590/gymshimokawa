import supabase from '../supabase'
import * as XLSX from 'xlsx'

export interface TableInfo {
  id: string
  name: string
  label: string
  group: string
  query: () => Promise<any[]>
}

export const tables: TableInfo[] = [
  // Clientes
  { id: 'clientes', name: 'clientes', label: 'Clientes', group: 'Clientes', query: async () => {
    const { data } = await supabase.from('clientes').select('*, tipo_membresia:tipos_membresia(nombre), descuento:descuentos(nombre)')
    return (data ?? []).map((c: any) => ({
      id: c.id, nombre: c.nombre, dni: c.dni, es_extranjero: c.es_extranjero,
      carnet_extranjeria: c.carnet_extranjeria, telefono: c.telefono,
      fecha_cumpleanos: c.fecha_cumpleanos, membresia: c.tipo_membresia?.nombre ?? '',
      fecha_inicio: c.fecha_inicio_membresia, fecha_vencimiento: c.fecha_vencimiento_membresia,
      estado: c.estado, descuento: c.descuento?.nombre ?? '', es_vip: c.es_vip,
      vip_desde: c.vip_desde, vip_motivo: c.vip_motivo, created_at: c.created_at,
    }))
  }},
  { id: 'tipos_membresia', name: 'tipos_membresia', label: 'Tipos Membresía', group: 'Clientes', query: async () => {
    const { data } = await supabase.from('tipos_membresia').select('*')
    return data ?? []
  }},
  { id: 'descuentos', name: 'descuentos', label: 'Descuentos', group: 'Clientes', query: async () => {
    const { data } = await supabase.from('descuentos').select('*')
    return data ?? []
  }},
  { id: 'asistencia_vip', name: 'asistencia_vip', label: 'Asistencia VIP', group: 'Clientes', query: async () => {
    const { data } = await supabase.from('asistencia_vip').select('*')
    return data ?? []
  }},

  // Ventas
  { id: 'ventas', name: 'ventas', label: 'Ventas', group: 'Ventas', query: async () => {
    const { data } = await supabase.from('ventas').select('*, cliente:clientes(nombre, dni)')
    return (data ?? []).map((v: any) => ({
      id: v.id, cliente: v.cliente?.nombre ?? 'Sin cliente', dni_cliente: v.cliente?.dni ?? '',
      subtotal: v.subtotal, descuento: v.descuento_aplicado, total: v.total,
      metodo_pago: v.metodo_pago, created_at: v.created_at,
    }))
  }},
  { id: 'detalle_ventas', name: 'detalle_ventas', label: 'Detalle Ventas', group: 'Ventas', query: async () => {
    const { data } = await supabase.from('detalle_ventas').select('*, producto:productos(nombre)')
    return (data ?? []).map((d: any) => ({
      id: d.id, venta_id: d.venta_id, producto: d.producto?.nombre ?? '',
      cantidad: d.cantidad, precio_unitario: d.precio_unitario,
      descuento: d.descuento_unitario, subtotal: d.subtotal,
    }))
  }},
  { id: 'productos', name: 'productos', label: 'Productos', group: 'Ventas', query: async () => {
    const { data } = await supabase.from('productos').select('*')
    return data ?? []
  }},
  { id: 'movimientos_stock', name: 'movimientos_stock', label: 'Movimientos Stock', group: 'Ventas', query: async () => {
    const { data } = await supabase.from('movimientos_stock').select('*, producto:productos(nombre)')
    return (data ?? []).map((m: any) => ({
      id: m.id, producto: m.producto?.nombre ?? '', tipo: m.tipo, cantidad: m.cantidad,
      stock_anterior: m.stock_anterior, stock_nuevo: m.stock_nuevo,
      motivo: m.motivo, created_at: m.created_at,
    }))
  }},

  // Finanzas
  { id: 'cajas', name: 'cajas', label: 'Cajas', group: 'Finanzas', query: async () => {
    const { data } = await supabase.from('cajas').select('*')
    return data ?? []
  }},
  { id: 'egresos', name: 'egresos', label: 'Egresos', group: 'Finanzas', query: async () => {
    const { data } = await supabase.from('egresos').select('*, categoria:categorias_egresos(nombre), personal:personal(nombre)')
    return (data ?? []).map((e: any) => ({
      id: e.id, fecha: e.fecha, categoria: e.categoria?.nombre ?? '',
      descripcion: e.descripcion, monto: e.monto, proveedor: e.proveedor,
      metodo_pago: e.metodo_pago, responsable: e.personal?.nombre ?? '',
      created_at: e.created_at,
    }))
  }},
  { id: 'fiados', name: 'fiados', label: 'Fiados', group: 'Finanzas', query: async () => {
    const { data } = await supabase.from('fiados').select('*, cliente:clientes(nombre, dni)')
    return (data ?? []).map((f: any) => ({
      id: f.id, cliente: f.cliente?.nombre ?? '', dni: f.cliente?.dni ?? '',
      monto_total: f.monto_total, monto_pagado: f.monto_pagado,
      estado: f.estado, metodo_pago: f.metodo_pago,
      fecha_limite: f.fecha_limite, created_at: f.created_at,
    }))
  }},
  { id: 'detalle_fiados', name: 'detalle_fiados', label: 'Detalle Fiados', group: 'Finanzas', query: async () => {
    const { data } = await supabase.from('detalle_fiados').select('*, producto:productos(nombre)')
    return (data ?? []).map((d: any) => ({
      id: d.id, fiado_id: d.fiado_id, producto: d.producto?.nombre ?? '',
      cantidad: d.cantidad, precio_unitario: d.precio_unitario, subtotal: d.subtotal,
    }))
  }},
  { id: 'pagos_membresia', name: 'pagos_membresia', label: 'Pagos Membresía', group: 'Finanzas', query: async () => {
    const { data } = await supabase.from('pagos_membresia').select('*, cliente:clientes(nombre, dni), tipo_membresia:tipos_membresia(nombre)')
    return (data ?? []).map((p: any) => ({
      id: p.id, cliente: p.cliente?.nombre ?? '', dni: p.cliente?.dni ?? '',
      membresia: p.tipo_membresia?.nombre ?? '', monto_base: p.monto_base,
      descuento: p.descuento_aplicado, monto_final: p.monto_final,
      metodo_pago: p.metodo_pago, fecha_inicio: p.fecha_inicio,
      fecha_vencimiento: p.fecha_vencimiento, created_at: p.created_at,
    }))
  }},

  // Operaciones
  { id: 'asistencia_clientes', name: 'asistencia_clientes', label: 'Asistencia Clientes', group: 'Operaciones', query: async () => {
    const { data } = await supabase.from('asistencia_clientes').select('*')
    return data ?? []
  }},
  { id: 'asistencia_personal', name: 'asistencia_personal', label: 'Asistencia Personal', group: 'Operaciones', query: async () => {
    const { data } = await supabase.from('asistencia_personal').select('*')
    return data ?? []
  }},
  { id: 'personal', name: 'personal', label: 'Personal', group: 'Operaciones', query: async () => {
    const { data } = await supabase.from('personal').select('*')
    return data ?? []
  }},

  // Sistema
  { id: 'usuarios', name: 'usuarios', label: 'Usuarios', group: 'Sistema', query: async () => {
    const { data } = await supabase.from('usuarios').select('*, rol:roles(nombre)')
    return (data ?? []).map((u: any) => ({
      id: u.id, nombre: u.nombre, email: u.email, telefono: u.telefono,
      rol: u.rol?.nombre ?? '', estado: u.estado,
      ultimo_acceso: u.ultimo_acceso, created_at: u.created_at,
    }))
  }},
  { id: 'roles', name: 'roles', label: 'Roles', group: 'Sistema', query: async () => {
    const { data } = await supabase.from('roles').select('*')
    return data ?? []
  }},
  { id: 'permisos', name: 'permisos', label: 'Permisos', group: 'Sistema', query: async () => {
    const { data } = await supabase.from('permisos').select('*, rol:roles(nombre)')
    return (data ?? []).map((p: any) => ({
      id: p.id, rol: p.rol?.nombre ?? '', seccion: p.seccion,
      puede_ver: p.puede_ver, puede_crear: p.puede_crear,
      puede_editar: p.puede_editar, puede_eliminar: p.puede_eliminar,
    }))
  }},
  { id: 'log_actividad', name: 'log_actividad', label: 'Log Actividad', group: 'Sistema', query: async () => {
    const { data } = await supabase.from('log_actividad').select('*')
    return data ?? []
  }},
  { id: 'historial_roles', name: 'historial_roles', label: 'Historial Roles', group: 'Sistema', query: async () => {
    const { data } = await supabase.from('historial_roles').select('*')
    return data ?? []
  }},
  { id: 'promocion_envios', name: 'promocion_envios', label: 'Envíos Promociones', group: 'Sistema', query: async () => {
    const { data } = await supabase.from('promocion_envios').select('*')
    return data ?? []
  }},
]

export function getTableGroups() {
  const groups: Record<string, TableInfo[]> = {}
  tables.forEach(t => {
    if (!groups[t.group]) groups[t.group] = []
    groups[t.group].push(t)
  })
  return groups
}

export function exportSingleTable(table: TableInfo, data: any[]) {
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ _sin_datos: 'Tabla vacía' }])
  XLSX.utils.book_append_sheet(wb, ws, table.label)
  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `gym_shimokawa_${table.name}_${date}.xlsx`)
}

export async function exportSelectedTables(selectedIds: string[]) {
  const selected = tables.filter(t => selectedIds.includes(t.id))
  const wb = XLSX.utils.book_new()
  for (const table of selected) {
    const data = await table.query()
    const ws = XLSX.utils.json_to_sheet(data.length ? data : [{ _sin_datos: 'Tabla vacía' }])
    XLSX.utils.book_append_sheet(wb, ws, table.label)
  }
  const date = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `gym_shimokawa_${date}.xlsx`)
}
