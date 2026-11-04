import type { Producto } from '../types'
import ProductoCard from './ProductoCard'

interface ProductoListProps {
  productos: Producto[]
  idOcupado: number | null
  onEditar: (producto: Producto) => void
  onAlternarDisponible: (producto: Producto) => void
  onAnular: (producto: Producto) => void
}

function ProductoList({
  productos,
  idOcupado,
  onEditar,
  onAlternarDisponible,
  onAnular,
}: ProductoListProps) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {productos.map((producto) => (
        <li key={producto.id}>
          <ProductoCard
            producto={producto}
            ocupado={idOcupado === producto.id}
            onEditar={onEditar}
            onAlternarDisponible={onAlternarDisponible}
            onAnular={onAnular}
          />
        </li>
      ))}
    </ul>
  )
}

export default ProductoList
