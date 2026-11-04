import Boton from './Boton'

interface EstadoVacioProps {
  onNuevoProducto: () => void
}

function EstadoVacio({ onNuevoProducto }: EstadoVacioProps) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-white p-12 text-center">
      <p className="text-base font-semibold text-slate-800">Todavía no hay productos</p>
      <p className="mt-1 text-sm text-slate-500">
        Cargá el primer producto del catálogo para empezar.
      </p>
      <Boton className="mt-5" onClick={onNuevoProducto}>
        + Nuevo producto
      </Boton>
    </div>
  )
}

export default EstadoVacio
