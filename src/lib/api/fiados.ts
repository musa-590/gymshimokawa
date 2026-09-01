import supabase from '../supabase'

export async function listarFiados(estado?: string) {
  let query = supabase.from('fiados')
    .select('*, cliente:clientes(nombre, dni), detalles:detalle_fiados(*, producto:productos(nombre))')
    .order('created_at', { ascending: false })
  if (estado) query = query.eq('estado', estado)
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function crearFiado(data: {
  cliente_id: string; caja_id: string; monto_total: number
  metodo_pago: string; fecha_limite: string; observaciones?: string
  items: { producto_id: string; cantidad: number; precio_unitario: number }[]
}) {
  const { data: fiado, error } = await supabase.from('fiados')
    .insert({
      cliente_id: data.cliente_id, caja_id: data.caja_id,
      monto_total: data.monto_total, monto_pagado: 0,
      estado: 'pendiente', metodo_pago: data.metodo_pago,
      fecha_limite: data.fecha_limite, observaciones: data.observaciones ?? null,
    }).select().single()
  if (error) throw error

  for (const item of data.items) {
    await supabase.from('detalle_fiados').insert({
      fiado_id: fiado.id, producto_id: item.producto_id,
      cantidad: item.cantidad, precio_unitario: item.precio_unitario,
      subtotal: item.cantidad * item.precio_unitario,
    })
    const { data: prod } = await supabase.from('productos')
      .select('stock').eq('id', item.producto_id).single()
    if (prod) {
      const stock_nuevo = prod.stock - item.cantidad
      await supabase.from('productos').update({ stock: stock_nuevo }).eq('id', item.producto_id)
      await supabase.from('movimientos_stock').insert({
        producto_id: item.producto_id, tipo: 'salida',
        cantidad: item.cantidad, stock_anterior: prod.stock, stock_nuevo,
        motivo: 'fiado', referencia_id: fiado.id,
      })
    }
  }
  return fiado
}

export async function pagarFiado(fiadoId: string, monto: number) {
  const { data: fiado } = await supabase.from('fiados')
    .select('total, monto_pagado').eq('id', fiadoId).single()
  if (!fiado) throw new Error('Fiado no encontrado')

  const nuevoPagado = (fiado.monto_pagado ?? 0) + monto
  const nuevoEstado = nuevoPagado >= fiado.total ? 'pagado' : 'pendiente'

  const { error } = await supabase.from('fiados')
    .update({ monto_pagado: nuevoPagado, estado: nuevoEstado })
    .eq('id', fiadoId)
  if (error) throw error
}

export async function anularFiado(fiadoId: string) {
  const { data: detalles } = await supabase.from('detalle_fiados')
    .select('producto_id, cantidad').eq('fiado_id', fiadoId)
  if (detalles) {
    for (const det of detalles) {
      const { data: prod } = await supabase.from('productos')
        .select('stock').eq('id', det.producto_id).single()
      if (prod) {
        const stock_nuevo = prod.stock + det.cantidad
        await supabase.from('productos').update({ stock: stock_nuevo }).eq('id', det.producto_id)
        await supabase.from('movimientos_stock').insert({
          producto_id: det.producto_id, tipo: 'entrada',
          cantidad: det.cantidad, stock_anterior: prod.stock, stock_nuevo,
          motivo: 'anulacion_fiado', referencia_id: fiadoId,
        })
      }
    }
  }
  const { error } = await supabase.from('fiados')
    .update({ estado: 'anulado' }).eq('id', fiadoId)
  if (error) throw error
}
