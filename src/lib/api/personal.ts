import supabase from '../supabase'
import type { Personal, PersonalFormData } from '../types'

export async function listarPersonal(search?: string) {
  let query = supabase.from('personal').select('*').order('created_at', { ascending: false })
  if (search) query = query.or(`nombre.ilike.%${search}%,dni.ilike.%${search}%`)
  const { data, error } = await query
  if (error) throw error
  return data as Personal[]
}

export async function crearPersonal(data: PersonalFormData) {
  const { data: persona, error } = await supabase.from('personal')
    .insert({ ...data, estado: 'activo' }).select().single()
  if (error) throw error
  return persona as Personal
}

export async function actualizarPersonal(id: string, data: Partial<PersonalFormData>) {
  const { data: persona, error } = await supabase.from('personal')
    .update(data).eq('id', id).select().single()
  if (error) throw error
  return persona as Personal
}

export async function eliminarPersonal(id: string) {
  const { error } = await supabase.from('personal').delete().eq('id', id)
  if (error) throw error
}
