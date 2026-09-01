export type ClienteEstado = 'activo' | 'por_vencer' | 'inactivo'
export type PersonalEstado = 'activo' | 'inactivo'
export type CajaEstado = 'abierta' | 'cerrada'
export type MovimientoStockTipo = 'entrada' | 'salida' | 'ajuste'
export type UsuarioEstado = 'activo' | 'inactivo' | 'suspendido'
export type MetodoPago = 'efectivo' | 'yape' | 'plin' | 'tarjeta'

export interface Descuento {
  id: string
  nombre: string
  descripcion: string | null
  tipo: 'porcentaje' | 'monto_fijo'
  valor: number
  activo: boolean
  created_at: string
  updated_at: string
  imagen_url?: string | null
}

export interface TipoMembresia {
  id: string
  nombre: string
  duracion_dias: number
  precio: number
  descripcion: string | null
  activo: boolean
  created_at: string
  updated_at: string
}

export interface Cliente {
  id: string
  nombre: string
  dni: string
  es_extranjero: boolean
  carnet_extranjeria: string | null
  telefono: string | null
  fecha_cumpleanos: string | null
  tipo_membresia_id: string | null
  fecha_inicio_membresia: string | null
  fecha_vencimiento_membresia: string | null
  estado: ClienteEstado
  descuento_id: string | null
  foto_url: string | null
  es_vip: boolean
  vip_desde: string | null
  vip_motivo: string | null
  creado_por: string | null
  registrado_por: string | null
  created_at: string
  updated_at: string
  tipo_membresia?: TipoMembresia
  descuento?: Descuento
  usuario_registrador?: { nombre: string }
}

export interface Personal {
  id: string
  nombre: string
  dni: string
  telefono: string | null
  cargo: string | null
  fecha_ingreso: string | null
  estado: PersonalEstado
  foto_url: string | null
  created_at: string
  updated_at: string
}

export interface Producto {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  stock: number
  stock_minimo: number
  categoria: string | null
  aplica_descuento: boolean
  activo: boolean
  imagen_url: string | null
  created_at: string
  updated_at: string
}

export interface MovimientoStock {
  id: string
  producto_id: string
  tipo: MovimientoStockTipo
  cantidad: number
  stock_anterior: number
  stock_nuevo: number
  motivo: string | null
  referencia_id: string | null
  created_at: string
  producto?: Producto
}

export interface Caja {
  id: string
  fecha_apertura: string
  fecha_cierre: string | null
  estado: CajaEstado
  monto_inicial: number
  monto_final: number | null
  total_ventas_productos: number
  total_membresias: number
  total_ingresos: number
  observaciones: string | null
  created_at: string
}

export interface Venta {
  id: string
  caja_id: string
  cliente_id: string | null
  subtotal: number
  descuento_aplicado: number
  total: number
  metodo_pago: MetodoPago
  created_at: string
  cliente?: Cliente
  detalles?: DetalleVenta[]
}

export interface DetalleVenta {
  id: string
  venta_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  descuento_unitario: number
  subtotal: number
  producto?: Producto
}

export interface PagoMembresia {
  id: string
  caja_id: string
  cliente_id: string
  tipo_membresia_id: string
  monto_base: number
  descuento_aplicado: number
  monto_final: number
  metodo_pago: MetodoPago
  fecha_inicio: string
  fecha_vencimiento: string
  created_at: string
  cliente?: Cliente
  tipo_membresia?: TipoMembresia
}

export interface AsistenciaCliente {
  id: string
  cliente_id: string
  dni: string
  fecha: string
  hora_entrada: string
  hora_salida: string | null
  created_at: string
  cliente?: Cliente
}

export interface AsistenciaPersonal {
  id: string
  personal_id: string
  dni: string
  fecha: string
  hora_entrada: string
  hora_salida: string | null
  created_at: string
  personal?: Personal
}

export interface Rol {
  id: string
  nombre: string
  descripcion: string | null
  created_at: string
}

export interface Permiso {
  id: string
  rol_id: string
  seccion: string
  puede_ver: boolean
  puede_crear: boolean
  puede_editar: boolean
  puede_eliminar: boolean
  created_at: string
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  telefono: string | null
  rol_id: string
  estado: UsuarioEstado
  avatar_url: string | null
  creado_por: string | null
  ultimo_acceso: string | null
  created_at: string
  updated_at: string
  rol?: Rol
}

export interface MembresiaPorVencer {
  id: string
  nombre: string
  dni: string
  telefono: string | null
  fecha_vencimiento_membresia: string
  tipo_membresia: string | null
  dias_restantes: number
}

export interface CumpleanosProximo {
  id: string
  nombre: string
  dni: string
  telefono: string | null
  fecha_cumpleanos: string
  proximo_cumpleanos: string
}

export type FiadoEstado = 'pendiente' | 'pagado' | 'anulado'

export interface Fiado {
  id: string
  cliente_id: string | null
  caja_id: string | null
  monto_total: number
  monto_pagado: number
  estado: FiadoEstado
  metodo_pago: MetodoPago
  fecha_limite: string
  observacion: string | null
  created_at: string
  updated_at: string
  cliente?: Cliente
  detalles?: DetalleFiado[]
}

export interface DetalleFiado {
  id: string
  fiado_id: string
  producto_id: string
  cantidad: number
  precio_unitario: number
  subtotal: number
  created_at: string
  producto?: Producto
}

export interface ClienteFormData {
  nombre: string
  dni: string
  es_extranjero?: boolean
  carnet_extranjeria?: string
  telefono?: string
  fecha_cumpleanos?: string
  tipo_membresia_id?: string
  descuento_id?: string
  es_vip?: boolean
  estado?: ClienteEstado
  fecha_vencimiento_membresia?: string
}

export interface PersonalFormData {
  nombre: string
  dni: string
  telefono?: string
  cargo?: string
  fecha_ingreso?: string
}

export interface ProductoFormData {
  nombre: string
  descripcion?: string
  precio: number
  stock: number
  stock_minimo?: number
  categoria?: string
  aplica_descuento?: boolean
  activo?: boolean
}

export interface VentaFormData {
  cliente_id?: string
  items: {
    producto_id: string
    cantidad: number
    precio_unitario: number
    descuento_unitario?: number
  }[]
}
