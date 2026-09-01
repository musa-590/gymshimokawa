import supabase from '../supabase'

export async function listarDescuentos() {
  const { data, error } = await supabase.from('descuentos')
    .select('*').order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function crearDescuento(data: any) {
  const { data: desc, error } = await supabase.from('descuentos')
    .insert({ ...data, activo: data.activo ?? true }).select().single()
  if (error) throw error
  return desc
}

export async function actualizarDescuento(id: string, data: any) {
  const { data: desc, error } = await supabase.from('descuentos')
    .update(data).eq('id', id).select().single()
  if (error) throw error
  return desc
}

export async function eliminarDescuento(id: string) {
  const { error } = await supabase.from('descuentos').delete().eq('id', id)
  if (error) throw error
}

export async function subirImagenPromocion(file: File) {
  const ext = file.name.split('.').pop()
  const nombre = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
  const { error } = await supabase.storage.from('promociones').upload(nombre, file)
  if (error) throw error
  const { data } = supabase.storage.from('promociones').getPublicUrl(nombre)
  return data.publicUrl
}
