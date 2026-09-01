import supabase from '../supabase'
import type { TipoMembresia } from '../types'

export async function listarTiposMembresia(soloActivos = false) {
  let query = supabase.from('tipos_membresia').select('*').order('duracion_dias', { ascending: true })
  if (soloActivos) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw error
  return data as TipoMembresia[]
}

export async function crearTipoMembresia(data: { nombre: string; duracion_dias: number; precio: number; descripcion?: string }) {
  const { data: tipo, error } = await supabase.from('tipos_membresia')
    .insert({ ...data, activo: true }).select().single()
  if (error) throw error
  return tipo as TipoMembresia
}

export async function actualizarTipoMembresia(id: string, data: Partial<TipoMembresia>) {
  const { data: tipo, error } = await supabase.from('tipos_membresia')
    .update(data).eq('id', id).select().single()
  if (error) throw error
  return tipo as TipoMembresia
}

export async function eliminarTipoMembresia(id: string) {
  const { error } = await supabase.from('tipos_membresia').delete().eq('id', id)
  if (error) throw error
}

// --- pagos_membresia ---

export async function listarPagosMembresia(limit = 50) {
  const { data, error } = await supabase.from('pagos_membresia')
    .select('*, clientes(nombre, dni), tipos_membresia(nombre)')
    .order('created_at', { ascending: false }).limit(limit)
  if (error) throw error
  return data
}

export async function crearPagoMembresia(data: {
  caja_id: string; cliente_id: string; tipo_membresia_id: string
  monto_base: number; descuento_aplicado?: number; monto_final: number
  metodo_pago: string; fecha_inicio: string; fecha_vencimiento: string
}) {
  const { data: pago, error } = await supabase.from('pagos_membresia')
    .insert({ ...data, descuento_aplicado: data.descuento_aplicado ?? 0 }).select().single()
  if (error) throw error
  return pago
}
