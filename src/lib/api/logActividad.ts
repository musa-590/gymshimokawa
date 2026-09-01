import supabase from '../supabase'

export async function registrarActividad(accion: string, seccion: string, descripcion?: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return
  const { error } = await supabase.from('log_actividad')
    .insert({ usuario_id: user.id, accion, seccion, descripcion: descripcion ?? '' })
  if (error) console.error('Error al registrar actividad:', error)
}
