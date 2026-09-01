import supabase from '../supabase'

export async function listarAsistencias(fechaDesde: string, fechaHasta: string, tipo: 'clientes' | 'personal' = 'clientes') {
  const table = tipo === 'clientes' ? 'asistencia_clientes' : 'asistencia_personal'
  const join = tipo === 'clientes' ? 'cliente:clientes(nombre)' : 'persona:personal(nombre)'
  const { data, error } = await supabase.from(table)
    .select(`*, ${join}`).gte('fecha', fechaDesde).lte('fecha', fechaHasta)
    .order('fecha', { ascending: false })
  if (error) throw error
  return data
}

export async function registrarEntrada(tipo: 'clientes' | 'personal', personaId: string, dni: string) {
  const table = tipo === 'clientes' ? 'asistencia_clientes' : 'asistencia_personal'
  const idField = tipo === 'clientes' ? 'cliente_id' : 'personal_id'
  const hoy = new Date().toISOString().split('T')[0]
  const hora = new Date().toISOString()

  // Verificar si ya tiene entrada hoy
  const { data: existente } = await supabase.from(table)
    .select('*').eq(idField, personaId).eq('fecha', hoy).maybeSingle()

  if (existente) {
    if (!existente.hora_entrada) {
      const { error } = await supabase.from(table)
        .update({ hora_entrada: hora }).eq('id', existente.id)
      if (error) throw error
      return { tipo: 'actualizado', id: existente.id }
    }
    return { tipo: 'ya_registrado', id: existente.id }
  }

  const { data, error } = await supabase.from(table)
    .insert({ [idField]: personaId, dni, fecha: hoy, hora_entrada: hora })
    .select().single()
  if (error) throw error
  return { tipo: 'creado', id: data.id }
}

export async function registrarSalida(tipo: 'clientes' | 'personal', asistenciaId: string) {
  const table = tipo === 'clientes' ? 'asistencia_clientes' : 'asistencia_personal'
  const hora = new Date().toISOString()
  const { error } = await supabase.from(table)
    .update({ hora_salida: hora }).eq('id', asistenciaId)
  if (error) throw error
}

export async function buscarPersona(tipo: 'clientes' | 'personal', dni: string) {
  const table = tipo === 'clientes' ? 'clientes' : 'personal'
  const { data, error } = await supabase.from(table)
    .select('id, nombre, dni').eq('dni', dni).maybeSingle()
  if (error) throw error
  return data
}

export async function marcarSalidasAutomaticas() {
  const { error } = await supabase.rpc('marcar_salidas_automaticas')
  if (error) throw error
}
