import supabase from '../supabase'

interface VentaItem {
  producto_id: string
  cantidad: number
  precio_unitario: number
  descuento_unitario?: number
}

export async function crearVenta(data: {
  caja_id: string; cliente_id?: string; subtotal: number
  descuento_aplicado?: number; total: number; metodo_pago: string
  items: VentaItem[]
}) {
  // 1. Insertar venta
  const { data: venta, error } = await supabase.from('ventas')
    .insert({
      caja_id: data.caja_id, cliente_id: data.cliente_id ?? null,
      subtotal: data.subtotal, descuento_aplicado: data.descuento_aplicado ?? 0,
      total: data.total, metodo_pago: data.metodo_pago,
    }).select().single()
  if (error) throw error

  // 2. Insertar detalle y actualizar stock
  for (const item of data.items) {
    const { error: detError } = await supabase.from('detalle_ventas')
      .insert({
        venta_id: venta.id, producto_id: item.producto_id,
        cantidad: item.cantidad, precio_unitario: item.precio_unitario,
        descuento_unitario: item.descuento_unitario ?? 0,
        subtotal: item.cantidad * item.precio_unitario,
      })
    if (detError) throw detError

    // Leer stock actual
    const { data: prod, error: stError } = await supabase.from('productos')
      .select('stock').eq('id', item.producto_id).single()
    if (stError) throw stError

    const stock_nuevo = prod.stock - item.cantidad
    const { error: upError } = await supabase.from('productos')
      .update({ stock: stock_nuevo }).eq('id', item.producto_id)
    if (upError) throw upError

    const { error: mvError } = await supabase.from('movimientos_stock')
      .insert({
        producto_id: item.producto_id, tipo: 'salida',
        cantidad: item.cantidad, stock_anterior: prod.stock,
        stock_nuevo, motivo: 'venta', referencia_id: venta.id,
      })
    if (mvError) throw mvError
  }

  return venta
}
