import supabase from '../supabase'
import type { Producto, ProductoFormData } from '../types'

export async function listarProductos(params?: { search?: string; soloActivos?: boolean; categoria?: string }) {
  let query = supabase.from('productos').select('*').order('created_at', { ascending: false })
  if (params?.search) {
    query = query.or(`nombre.ilike.%${params.search}%,descripcion.ilike.%${params.search}%`)
  }
  if (params?.soloActivos) query = query.eq('activo', true)
  if (params?.categoria) query = query.eq('categoria', params.categoria)
  const { data, error } = await query
  if (error) throw error
  return data as Producto[]
}

export async function buscarProductosVenta(search: string) {
  const { data, error } = await supabase.from('productos')
    .select('id, nombre, precio, stock')
    .eq('activo', true).gt('stock', 0)
    .ilike('nombre', `%${search}%`).limit(10)
  if (error) throw error
  return data
}

export async function crearProducto(data: ProductoFormData) {
  const { data: prod, error } = await supabase.from('productos')
    .insert({ ...data, activo: true }).select().single()
  if (error) throw error
  return prod as Producto
}

export async function actualizarProducto(id: string, data: Partial<ProductoFormData>) {
  const { data: prod, error } = await supabase.from('productos')
    .update(data).eq('id', id).select().single()
  if (error) throw error
  return prod as Producto
}

export async function eliminarProducto(id: string) {
  const { error } = await supabase.from('productos')
    .update({ activo: false }).eq('id', id)
  if (error) throw error
}
