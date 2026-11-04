import type { Producto, ProductoPayload, UnidadMedida } from './types'

/**
 * Acceso a la API con fetch nativo.
 * Solo lo usa App.tsx: los componentes hijos no consultan la API por su cuenta.
 */
const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:8000/api/v1'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

interface DetalleValidacion {
  loc: Array<string | number>
  msg: string
}

/** Convierte el {"detail": ...} de FastAPI en un texto legible. */
async function extraerMensaje(respuesta: Response): Promise<string> {
  try {
    const cuerpo: unknown = await respuesta.json()
    if (typeof cuerpo === 'object' && cuerpo !== null && 'detail' in cuerpo) {
      const detail = (cuerpo as { detail: unknown }).detail
      if (typeof detail === 'string') return detail
      if (Array.isArray(detail)) {
        return (detail as DetalleValidacion[])
          .map((d) => `${d.loc.filter((parte) => parte !== 'body').join('.')}: ${d.msg}`)
          .join(' · ')
      }
    }
  } catch {
    // la respuesta no era JSON
  }
  return `Error ${respuesta.status} al comunicarse con la API`
}

async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let respuesta: Response
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: { 'Content-Type': 'application/json', ...opciones.headers },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(0, 'No se pudo conectar con la API. ¿Está corriendo el backend en http://localhost:8000?')
  }
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, await extraerMensaje(respuesta))
  }
  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

export function listarProductos(signal?: AbortSignal): Promise<Producto[]> {
  // limit=50 es el máximo que admite la API
  return solicitar<Producto[]>('/productos?limit=50', { signal })
}

export function listarUnidades(signal?: AbortSignal): Promise<UnidadMedida[]> {
  return solicitar<UnidadMedida[]>('/unidades-medida', { signal })
}

export function crearProducto(datos: ProductoPayload): Promise<Producto> {
  return solicitar<Producto>('/productos', { method: 'POST', body: JSON.stringify(datos) })
}

export function actualizarProducto(id: number, datos: ProductoPayload): Promise<Producto> {
  return solicitar<Producto>(`/productos/${id}`, { method: 'PUT', body: JSON.stringify(datos) })
}

export function anularProducto(id: number): Promise<void> {
  return solicitar<void>(`/productos/${id}`, { method: 'DELETE' })
}
