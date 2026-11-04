import { formatearPrecio, formatearStock } from '../formato'
import type { Producto } from '../types'
import Boton from './Boton'
import Insignia from './Insignia'

interface ProductoCardProps {
  producto: Producto
  ocupado: boolean
  onEditar: (producto: Producto) => void
  onAlternarDisponible: (producto: Producto) => void
  onAnular: (producto: Producto) => void
}

function ProductoCard({
  producto,
  ocupado,
  onEditar,
  onAlternarDisponible,
  onAnular,
}: ProductoCardProps) {
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md ${
        producto.disponible ? 'border-slate-200' : 'border-slate-200 bg-slate-50'
      }`}
      aria-busy={ocupado}
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold leading-snug text-slate-900">{producto.nombre}</h2>
        <Insignia tono={producto.disponible ? 'verde' : 'gris'}>
          {producto.disponible ? 'Disponible' : 'Venta pausada'}
        </Insignia>
      </div>

      <p className="mt-1 line-clamp-2 min-h-10 text-sm text-slate-500">
        {producto.descripcion ?? 'Sin descripción'}
      </p>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {formatearPrecio(producto)}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-sm text-slate-600">{formatearStock(producto)}</span>
        <Insignia tono={producto.hay_stock ? 'azul' : 'rojo'}>
          {producto.hay_stock ? 'Con stock' : 'Sin stock'}
        </Insignia>
      </div>

      {producto.categorias.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-1.5" aria-label="Categorías">
          {producto.categorias.map((categoria) => (
            <li key={categoria.id}>
              <Insignia tono={categoria.es_principal ? 'naranja' : 'gris'}>
                {categoria.es_principal ? '★ ' : ''}
                {categoria.nombre}
              </Insignia>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-5">
        <Boton variante="secundario" tamano="sm" disabled={ocupado} onClick={() => onEditar(producto)}>
          Editar
        </Boton>
        <Boton
          variante="advertencia"
          tamano="sm"
          disabled={ocupado}
          onClick={() => onAlternarDisponible(producto)}
        >
          {producto.disponible ? 'Pausar venta' : 'Reanudar venta'}
        </Boton>
        <Boton variante="peligro" tamano="sm" disabled={ocupado} onClick={() => onAnular(producto)}>
          Anular
        </Boton>
      </div>
    </article>
  )
}

export default ProductoCard
