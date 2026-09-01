import supabase from '../supabase'
import type { Cliente, ClienteFormData, ClienteEstado } from '../types'

export async function listarClientes(params?: {
  search?: string
  estado?: ClienteEstado
  tipoMembresiaId?: string
  page?: number
  pageSize?: number
}) {
  const page = params?.page ?? 1
  const pageSize = params?.pageSize ?? 10
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('clientes')
    .select('*, tipo_membresia:tipos_membresia(*), descuento:descuentos(*)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to)

  if (params?.search) {
    query = query.or(`nombre.ilike.%${params.search}%,dni.ilike.%${params.search}%`)
  }
  if (params?.estado) {
    query = query.eq('estado', params.estado)
  }
  if (params?.tipoMembresiaId) {
    query = query.eq('tipo_membresia_id', params.tipoMembresiaId)
  }

  const { data, count, error } = await query
  if (error) throw error
  return { data: data as Cliente[], count: count ?? 0 }
}

export async function obtenerCliente(id: string) {
  const { data, error } = await supabase.from('clientes')
    .select('*, tipo_membresia:tipos_membresia(*), descuento:descuentos(*)')
    .eq('id', id).single()
  if (error) throw error
  return data as Cliente
}

export async function crearCliente(data: ClienteFormData & { registrado_por: string }) {
  const { data: cliente, error } = await supabase.from('clientes')
    .insert({ ...data, estado: 'activo' }).select().single()
  if (error) throw error
  return cliente as Cliente
}

export async function actualizarCliente(id: string, data: Partial<ClienteFormData>) {
  const { data: cliente, error } = await supabase.from('clientes')
    .update(data).eq('id', id).select().single()
  if (error) throw error
  return cliente as Cliente
}

export async function eliminarCliente(id: string) {
  const { error } = await supabase.from('clientes')
    .update({ estado: 'inactivo' }).eq('id', id)
  if (error) throw error
}

export async function eliminarClienteDefinitivo(id: string) {
  const { error } = await supabase.rpc('eliminar_cliente', { p_cliente_id: id })
  if (error) throw error
}

export async function verificarDniDisponible(dni: string, excludeId?: string) {
  let query = supabase.from('clientes').select('id').eq('dni', dni)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return !data
}

export async function verificarCarnetDisponible(carnet: string, excludeId?: string) {
  let query = supabase.from('clientes').select('id').eq('carnet_extranjeria', carnet)
  if (excludeId) query = query.neq('id', excludeId)
  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return !data
}

export async function actualizarEstadosClientes() {
  const { error } = await supabase.rpc('actualizar_estados_clientes', {
    fecha_actual: new Date().toISOString().split('T')[0],
    fecha_por_vencer: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
  })
  if (error) throw error
}

export async function importarClientesBulk(clientes: (ClienteFormData & { registrado_por: string })[]) {
  const { data, error } = await supabase.from('clientes')
    .insert(clientes.map(c => ({ ...c, estado: 'activo' }))).select()
  if (error) throw error
  return data as Cliente[]
}

// --- VIP ---

export async function listarClientesVip() {
  const { data, error } = await supabase.from('v_clientes_vip').select('*').order('nombre', { ascending: true })
  if (error) throw error
  return data
}

export async function promoverAVip(clienteId: string, motivo: string) {
  const { error } = await supabase.from('clientes')
    .update({
      es_vip: true,
      vip_motivo: motivo,
      vip_desde: new Date().toISOString(),
    }).eq('id', clienteId)
  if (error) throw error
}

export async function quitarVip(clienteId: string) {
  const { error } = await supabase.from('clientes')
    .update({ es_vip: false, vip_desde: null, vip_motivo: null }).eq('id', clienteId)
  if (error) throw error
}

export async function registrarEntradaVip(cliente_id: string, dni: string) {
  const { data, error } = await supabase.from('asistencia_vip')
    .insert({ cliente_id, dni }).select().single()
  if (error) throw error
  return data
}

export async function registrarSalidaVip(asistenciaId: string) {
  const { error } = await supabase.from('asistencia_vip')
    .update({ hora_salida: new Date().toISOString() }).eq('id', asistenciaId)
  if (error) throw error
}

export async function obtenerHistorialVip(clienteId?: string) {
  let query = supabase.from('asistencia_vip').select('*')
    .order('hora_entrada', { ascending: false }).limit(500)
  if (clienteId) query = query.eq('cliente_id', clienteId)
  const { data, error } = await query
  if (error) throw error
  return data
}
