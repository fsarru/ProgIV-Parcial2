import type { CategoriaDeProducto } from './categoria'
import type { UnidadMedida } from './unidadMedida'

/** Producto tal como lo devuelve la API (ProductoPublic) */
export interface Producto {
  id: number
  nombre: string
  descripcion: string | null
  precio_base: number
  stock_cantidad: number
  hay_stock: boolean
  disponible: boolean
  activo: boolean
  anulado_at: string | null
  unidad_venta: UnidadMedida
  categorias: CategoriaDeProducto[]
}

/** Cuerpo de POST y PUT /api/v1/productos */
export interface ProductoPayload {
  nombre: string
  descripcion: string | null
  precio_base: number
  unidad_venta_id: number
  stock_cantidad: number
  disponible: boolean
}
