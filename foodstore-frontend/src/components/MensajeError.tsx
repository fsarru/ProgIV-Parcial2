import Boton from './Boton'

interface MensajeErrorProps {
  mensaje: string
  onReintentar: () => void
}

function MensajeError({ mensaje, onReintentar }: MensajeErrorProps) {
  return (
    <div
      role="alert"
      className="rounded-xl border border-red-200 bg-red-50 p-8 text-center"
    >
      <p className="text-base font-semibold text-red-800">No se pudo cargar el catálogo</p>
      <p className="mt-1 text-sm text-red-700">{mensaje}</p>
      <Boton variante="peligro" className="mt-5" onClick={onReintentar}>
        Reintentar
      </Boton>
    </div>
  )
}

export default MensajeError
