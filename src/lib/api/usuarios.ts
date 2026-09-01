import supabase from '../supabase'
import type { Usuario } from '../types'

export async function listarUsuarios(search?: string) {
  let query = supabase.from('usuarios')
    .select('*, roles(id, nombre, descripcion)')
    .order('created_at', { ascending: false })
  if (search) query = query.or(`nombre.ilike.%${search}%,email.ilike.%${search}%`)
  const { data, error } = await query
  if (error) throw error
  return data as Usuario[]
}

export async function obtenerRoles() {
  const { data, error } = await supabase.from('roles')
    .select('id, nombre, descripcion').order('nombre')
  if (error) throw error
  return data
}

export async function obtenerPermisos(rolId: string) {
  const { data, error } = await supabase.from('permisos')
    .select('seccion, puede_ver, puede_crear, puede_editar, puede_eliminar')
    .eq('rol_id', rolId)
  if (error) throw error
  return data
}

export async function crearUsuario(data: {
  nombre: string
  email: string
  telefono?: string
  rol_id: string
  password: string
}) {
  const { data: result, error } = await supabase.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: { nombre: data.nombre },
  })
  if (error) throw error

  const { error: dbError } = await supabase.from('usuarios').insert({
    id: result.user.id,
    nombre: data.nombre,
    email: data.email,
    telefono: data.telefono || null,
    rol_id: data.rol_id,
    estado: 'activo',
  })
  if (dbError) throw dbError
}

export async function actualizarUsuario(id: string, data: {
  nombre?: string
  telefono?: string
  rol_id?: string
  estado?: string
}) {
  const { error } = await supabase.from('usuarios')
    .update(data).eq('id', id)
  if (error) throw error
}

export async function eliminarUsuarioDefinitivo(id: string) {
  const { error } = await supabase.rpc('eliminar_usuario', { p_usuario_id: id })
  if (error) throw error
}
