import type { Producto } from './types'

const formatoPrecio = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const formatoStock = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 3 })

/** «$ 12,50 / kg» */
export function formatearPrecio(producto: Producto): string {
  return `$ ${formatoPrecio.format(producto.precio_base)} / ${producto.unidad_venta.simbolo}`
}

/** «stock: 3,5 kg» */
export function formatearStock(producto: Producto): string {
  return `stock: ${formatoStock.format(producto.stock_cantidad)} ${producto.unidad_venta.simbolo}`
}
