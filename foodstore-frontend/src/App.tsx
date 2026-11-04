import { useEffect, useState } from 'react'
import {
  actualizarProducto,
  anularProducto,
  crearProducto,
  listarProductos,
  listarUnidades,
} from './api'
import ConfirmarAnularModal from './components/ConfirmarAnularModal'
import EstadoCarga from './components/EstadoCarga'
import EstadoVacio from './components/EstadoVacio'
import MensajeError from './components/MensajeError'
import Navbar from './components/Navbar'
import ProductoList from './components/ProductoList'
import ProductoModal from './components/ProductoModal'
import type { Producto, ProductoPayload, UnidadMedida } from './types'

function mensajeDe(error: unknown): string {
  return error instanceof Error ? error.message : 'Ocurrió un error inesperado'
}

function esAbort(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}

function App() {
  // --- Estado del catálogo (vive acá; los hijos lo reciben por props) ---
  const [productos, setProductos] = useState<Producto[]>([])
  const [unidades, setUnidades] = useState<UnidadMedida[]>([])
  const [cargando, setCargando] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [intento, setIntento] = useState<number>(0)

  // --- Modal de alta / edición ---
  const [modalAbierto, setModalAbierto] = useState<boolean>(false)
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [guardando, setGuardando] = useState<boolean>(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  // --- Acciones sobre un producto (pausar venta / anular) ---
  const [idOcupado, setIdOcupado] = useState<number | null>(null)
  const [productoAAnular, setProductoAAnular] = useState<Producto | null>(null)
  const [errorAccion, setErrorAccion] = useState<string | null>(null)

  // Carga inicial al montar el componente (y cada vez que se pide reintentar)
  useEffect(() => {
    const controlador = new AbortController()

    async function cargarCatalogo() {
      try {
        const [listaProductos, listaUnidades] = await Promise.all([
          listarProductos(controlador.signal),
          listarUnidades(controlador.signal),
        ])
        setProductos(listaProductos)
        setUnidades(listaUnidades)
        setCargando(false)
      } catch (e) {
        if (esAbort(e)) return
        setError(mensajeDe(e))
        setCargando(false)
      }
    }

    void cargarCatalogo()
    return () => controlador.abort()
  }, [intento])

  function reintentarCarga() {
    setCargando(true)
    setError(null)
    setIntento((n) => n + 1)
  }

  // Refresca la lista después de cada alta, edición, cambio de disponibilidad o anulación
  async function refrescarProductos() {
    try {
      setProductos(await listarProductos())
    } catch (e) {
      setErrorAccion(`No se pudo actualizar el listado: ${mensajeDe(e)}`)
    }
  }

  function abrirAlta() {
    setProductoSeleccionado(null)
    setErrorModal(null)
    setModalAbierto(true)
  }

  function abrirEdicion(producto: Producto) {
    setProductoSeleccionado(producto)
    setErrorModal(null)
    setModalAbierto(true)
  }

  function cerrarModal() {
    setModalAbierto(false)
    setProductoSeleccionado(null)
    setErrorModal(null)
  }

  async function guardarProducto(datos: ProductoPayload) {
    setGuardando(true)
    setErrorModal(null)
    try {
      if (productoSeleccionado === null) {
        await crearProducto(datos)
      } else {
        await actualizarProducto(productoSeleccionado.id, datos)
      }
    } catch (e) {
      // Un 409 (nombre repetido) o 422 se muestra dentro del modal, sin cerrarlo
      setErrorModal(mensajeDe(e))
      setGuardando(false)
      return
    }
    setGuardando(false)
    cerrarModal()
    await refrescarProductos()
  }

  async function alternarDisponibilidad(producto: Producto) {
    setIdOcupado(producto.id)
    setErrorAccion(null)
    try {
      await actualizarProducto(producto.id, {
        nombre: producto.nombre,
        descripcion: producto.descripcion,
        precio_base: producto.precio_base,
        unidad_venta_id: producto.unidad_venta.id,
        stock_cantidad: producto.stock_cantidad,
        disponible: !producto.disponible,
      })
      await refrescarProductos()
    } catch (e) {
      setErrorAccion(mensajeDe(e))
    } finally {
      setIdOcupado(null)
    }
  }

  async function confirmarAnulacion() {
    if (productoAAnular === null) return
    setIdOcupado(productoAAnular.id)
    setErrorAccion(null)
    try {
      await anularProducto(productoAAnular.id)
      setProductoAAnular(null)
      await refrescarProductos()
    } catch (e) {
      setProductoAAnular(null)
      setErrorAccion(mensajeDe(e))
    } finally {
      setIdOcupado(null)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar onNuevoProducto={abrirAlta} deshabilitarAlta={cargando || error !== null} />

      <main className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Catálogo de productos
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {cargando || error !== null
              ? 'Productos activos del local'
              : `${productos.length} ${productos.length === 1 ? 'producto activo' : 'productos activos'}`}
          </p>
        </div>

        {errorAccion && (
          <div
            role="alert"
            className="mb-4 flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            <span>{errorAccion}</span>
            <button
              type="button"
              onClick={() => setErrorAccion(null)}
              className="font-medium underline hover:text-red-950"
            >
              Cerrar
            </button>
          </div>
        )}

        {cargando ? (
          <EstadoCarga />
        ) : error !== null ? (
          <MensajeError mensaje={error} onReintentar={reintentarCarga} />
        ) : productos.length === 0 ? (
          <EstadoVacio onNuevoProducto={abrirAlta} />
        ) : (
          <ProductoList
            productos={productos}
            idOcupado={idOcupado}
            onEditar={abrirEdicion}
            onAlternarDisponible={(p) => void alternarDisponibilidad(p)}
            onAnular={setProductoAAnular}
          />
        )}
      </main>

      {modalAbierto && (
        <ProductoModal
          key={productoSeleccionado?.id ?? 'nuevo'}
          producto={productoSeleccionado}
          unidades={unidades}
          guardando={guardando}
          error={errorModal}
          onGuardar={(datos) => void guardarProducto(datos)}
          onCancelar={cerrarModal}
        />
      )}

      {productoAAnular !== null && (
        <ConfirmarAnularModal
          producto={productoAAnular}
          anulando={idOcupado === productoAAnular.id}
          onConfirmar={() => void confirmarAnulacion()}
          onCancelar={() => setProductoAAnular(null)}
        />
      )}
    </div>
  )
}

export default App
