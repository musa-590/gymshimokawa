import supabase from '../supabase'
import type { Caja } from '../types'

export async function obtenerCajaAbierta() {
  const { data, error } = await supabase.from('cajas')
    .select('*').eq('estado', 'abierta')
    .order('fecha_apertura', { ascending: false }).limit(1).maybeSingle()
  if (error) throw error
  return data as Caja | null
}

export async function listarHistorialCajas(limit = 30) {
  const { data, error } = await supabase.from('cajas')
    .select('*').order('fecha_apertura', { ascending: false }).limit(limit)
  if (error) throw error
  return data as Caja[]
}

export async function abrirCaja(monto_inicial: number) {
  const { data, error } = await supabase.from('cajas')
    .insert({ monto_inicial, estado: 'abierta', fecha_apertura: new Date().toISOString() })
    .select().single()
  if (error) throw error
  return data as Caja
}

export async function cerrarCaja(id: string, data: { monto_final: number; observaciones?: string }) {
  const { data: caja, error } = await supabase.from('cajas')
    .update({
      estado: 'cerrada',
      fecha_cierre: new Date().toISOString(),
      monto_final: data.monto_final,
      observaciones: data.observaciones ?? null,
    }).eq('id', id).select().single()
  if (error) throw error
  return caja as Caja
}

export async function obtenerDetalleCaja(cajaId: string) {
  const [ventas, pagos] = await Promise.all([
    supabase.from('ventas')
      .select('*, clientes(nombre, dni), detalle_ventas(*, productos(nombre))')
      .eq('caja_id', cajaId).order('created_at', { ascending: false }),
    supabase.from('pagos_membresia')
      .select('*, clientes(nombre, dni), tipos_membresia(nombre)')
      .eq('caja_id', cajaId).order('created_at', { ascending: false }),
  ])
  if (ventas.error) throw ventas.error
  if (pagos.error) throw pagos.error
  return { ventas: ventas.data, pagos_membresia: pagos.data }
}
