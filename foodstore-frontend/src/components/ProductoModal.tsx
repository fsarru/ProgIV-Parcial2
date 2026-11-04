import { useId, useState } from 'react'
import type { FormEvent } from 'react'
import { claseInput, claseInputError } from '../estilos'
import type { Producto, ProductoPayload, UnidadMedida } from '../types'
import Boton from './Boton'
import Campo from './Campo'
import Modal from './Modal'

interface ProductoModalProps {
  /** null: alta (formulario vacío). Con producto: edición (datos precargados). */
  producto: Producto | null
  unidades: UnidadMedida[]
  guardando: boolean
  /** Error devuelto por la API (por ejemplo 409 por nombre repetido). */
  error: string | null
  onGuardar: (datos: ProductoPayload) => void
  onCancelar: () => void
}

interface FormularioProducto {
  nombre: string
  descripcion: string
  precio_base: string
  unidad_venta_id: string
  stock_cantidad: string
  disponible: boolean
}

type ErroresFormulario = Partial<Record<keyof FormularioProducto, string>>

function formularioInicial(producto: Producto | null): FormularioProducto {
  if (producto === null) {
    return {
      nombre: '',
      descripcion: '',
      precio_base: '',
      unidad_venta_id: '',
      stock_cantidad: '0',
      disponible: true,
    }
  }
  return {
    nombre: producto.nombre,
    descripcion: producto.descripcion ?? '',
    precio_base: String(producto.precio_base),
    unidad_venta_id: String(producto.unidad_venta.id),
    stock_cantidad: String(producto.stock_cantidad),
    disponible: producto.disponible,
  }
}

function ProductoModal({
  producto,
  unidades,
  guardando,
  error,
  onGuardar,
  onCancelar,
}: ProductoModalProps) {
  // Estado del formulario con useState: vacío al crear, con los datos del producto al editar
  const [formulario, setFormulario] = useState<FormularioProducto>(() => formularioInicial(producto))
  const [errores, setErrores] = useState<ErroresFormulario>({})
  const idBase = useId()
  const id = (campo: string) => `${idBase}-${campo}`

  const unidadElegida = unidades.find((u) => String(u.id) === formulario.unidad_venta_id)
  const esContable = unidadElegida?.tipo === 'contable'

  function cambiarCampo<K extends keyof FormularioProducto>(campo: K, valor: FormularioProducto[K]) {
    setFormulario((anterior) => ({ ...anterior, [campo]: valor }))
    setErrores((anteriores) => ({ ...anteriores, [campo]: undefined }))
  }

  function validar(): ErroresFormulario {
    const nuevos: ErroresFormulario = {}
    if (formulario.nombre.trim().length < 3) {
      nuevos.nombre = 'El nombre debe tener al menos 3 caracteres'
    }
    if (!/^\d+(\.\d{1,2})?$/.test(formulario.precio_base.trim())) {
      nuevos.precio_base = 'Ingresá un precio mayor o igual a 0, con hasta 2 decimales'
    }
    if (formulario.unidad_venta_id === '') {
      nuevos.unidad_venta_id = 'Elegí la unidad de venta'
    }
    const stock = formulario.stock_cantidad.trim() === '' ? '0' : formulario.stock_cantidad.trim()
    if (!/^\d+(\.\d{1,3})?$/.test(stock)) {
      nuevos.stock_cantidad = 'Ingresá un stock mayor o igual a 0, con hasta 3 decimales'
    } else if (esContable && !Number.isInteger(Number(stock))) {
      nuevos.stock_cantidad = `El stock debe ser un número entero para la unidad «${unidadElegida?.nombre}»`
    }
    return nuevos
  }

  function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const nuevos = validar()
    setErrores(nuevos)
    if (Object.keys(nuevos).length > 0) return

    onGuardar({
      nombre: formulario.nombre.trim(),
      descripcion: formulario.descripcion.trim() === '' ? null : formulario.descripcion.trim(),
      precio_base: Number(formulario.precio_base),
      unidad_venta_id: Number(formulario.unidad_venta_id),
      stock_cantidad: formulario.stock_cantidad.trim() === '' ? 0 : Number(formulario.stock_cantidad),
      disponible: formulario.disponible,
    })
  }

  const clase = (campo: keyof FormularioProducto) =>
    `${claseInput} ${errores[campo] ? claseInputError : ''}`

  return (
    <Modal
      titulo={producto === null ? 'Nuevo producto' : 'Editar producto'}
      onCerrar={onCancelar}
      bloqueado={guardando}
    >
      <form onSubmit={alEnviar} noValidate className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
          >
            {error}
          </div>
        )}

        <Campo etiqueta="Nombre" htmlFor={id('nombre')} error={errores.nombre}>
          <input
            id={id('nombre')}
            type="text"
            autoFocus
            maxLength={100}
            value={formulario.nombre}
            onChange={(e) => cambiarCampo('nombre', e.target.value)}
            className={clase('nombre')}
            placeholder="Ej.: Queso cremoso"
            disabled={guardando}
          />
        </Campo>

        <Campo etiqueta="Descripción (opcional)" htmlFor={id('descripcion')}>
          <textarea
            id={id('descripcion')}
            rows={2}
            value={formulario.descripcion}
            onChange={(e) => cambiarCampo('descripcion', e.target.value)}
            className={claseInput}
            disabled={guardando}
          />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Precio base ($)" htmlFor={id('precio')} error={errores.precio_base}>
            <input
              id={id('precio')}
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={formulario.precio_base}
              onChange={(e) => cambiarCampo('precio_base', e.target.value)}
              className={clase('precio_base')}
              placeholder="0,00"
              disabled={guardando}
            />
          </Campo>

          <Campo etiqueta="Unidad de venta" htmlFor={id('unidad')} error={errores.unidad_venta_id}>
            <select
              id={id('unidad')}
              value={formulario.unidad_venta_id}
              onChange={(e) => cambiarCampo('unidad_venta_id', e.target.value)}
              className={clase('unidad_venta_id')}
              disabled={guardando || unidades.length === 0}
            >
              <option value="">Seleccioná una unidad</option>
              {unidades.map((unidad) => (
                <option key={unidad.id} value={unidad.id}>
                  {unidad.nombre} ({unidad.simbolo})
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo
          etiqueta={`Stock${unidadElegida ? ` (${unidadElegida.simbolo})` : ''}`}
          htmlFor={id('stock')}
          error={errores.stock_cantidad}
          ayuda={
            unidadElegida
              ? esContable
                ? 'Unidad contable: solo números enteros.'
                : 'Se registra en la unidad de venta; admite hasta 3 decimales.'
              : 'Elegí primero la unidad de venta.'
          }
        >
          <input
            id={id('stock')}
            type="number"
            inputMode="decimal"
            min="0"
            step={esContable ? '1' : '0.001'}
            value={formulario.stock_cantidad}
            onChange={(e) => cambiarCampo('stock_cantidad', e.target.value)}
            className={clase('stock_cantidad')}
            disabled={guardando}
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={formulario.disponible}
            onChange={(e) => cambiarCampo('disponible', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500"
            disabled={guardando}
          />
          Disponible para la venta
        </label>

        <div className="flex justify-end gap-2 pt-2">
          <Boton variante="secundario" onClick={onCancelar} disabled={guardando}>
            Cancelar
          </Boton>
          <Boton type="submit" disabled={guardando}>
            {guardando ? 'Guardando…' : producto === null ? 'Crear producto' : 'Guardar cambios'}
          </Boton>
        </div>
      </form>
    </Modal>
  )
}

export default ProductoModal
