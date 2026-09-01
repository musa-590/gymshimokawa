import supabase from '../supabase'

export async function listarEgresos(filtros?: {
  fechaDesde?: string; fechaHasta?: string; categoriaId?: string
  page?: number; pageSize?: number
}) {
  const page = filtros?.page ?? 1
  const pageSize = filtros?.pageSize ?? 15
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('egresos')
    .select('*, categoria:categorias_egresos(*), usuario:usuarios!egresos_usuario_id_fkey(nombre)', { count: 'exact' })
    .order('fecha', { ascending: false })
    .range(from, to)
  if (filtros?.fechaDesde) query = query.gte('fecha', filtros.fechaDesde)
  if (filtros?.fechaHasta) query = query.lte('fecha', filtros.fechaHasta)
  if (filtros?.categoriaId) query = query.eq('categoria_id', filtros.categoriaId)
  const { data, count, error } = await query
  if (error) throw error
  return { data: data ?? [], count: count ?? 0 }
}

export async function crearEgreso(data: any) {
  const { data: egreso, error } = await supabase.from('egresos').insert(data).select().single()
  if (error) throw error
  return egreso
}

export async function actualizarEgreso(id: string, data: any) {
  const { data: egreso, error } = await supabase.from('egresos')
    .update({ ...data, updated_at: new Date().toISOString() }).eq('id', id).select().single()
  if (error) throw error
  return egreso
}

export async function eliminarEgreso(id: string) {
  const { error } = await supabase.from('egresos').delete().eq('id', id)
  if (error) throw error
}

export async function listarPersonalEgresos() {
  const { data, error } = await supabase.from('personal')
    .select('id, nombre, dni').eq('estado', 'activo').order('nombre')
  if (error) throw error
  return data
}

export async function listarCategoriasEgresos() {
  const { data, error } = await supabase.from('categorias_egresos')
    .select('*').eq('activo', true).order('nombre')
  if (error) throw error
  return data
}
