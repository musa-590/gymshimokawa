import supabase from '../supabase'
import type { AlertaPagoPlataforma } from '../types'

export async function obtenerAlertaPago(): Promise<AlertaPagoPlataforma | null> {
  const { data, error } = await supabase.from('alerta_pago_plataforma')
    .select('*').limit(1).maybeSingle()
  if (error) throw error
  return data as AlertaPagoPlataforma | null
}

export async function guardarAlertaPago(data: { activado: boolean; fecha_vencimiento: string | null; dias_aviso: number }) {
  const { error } = await supabase.from('alerta_pago_plataforma')
    .upsert({ id: true, ...data, updated_at: new Date().toISOString() })
  if (error) throw error
}