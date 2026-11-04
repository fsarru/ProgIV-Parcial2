import type { Producto } from '../types'
import Boton from './Boton'
import Modal from './Modal'

interface ConfirmarAnularModalProps {
  producto: Producto
  anulando: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

function ConfirmarAnularModal({
  producto,
  anulando,
  onConfirmar,
  onCancelar,
}: ConfirmarAnularModalProps) {
  return (
    <Modal titulo="Anular producto" onCerrar={onCancelar} bloqueado={anulando}>
      <p className="text-sm text-slate-600">
        ¿Querés anular <strong className="text-slate-900">{producto.nombre}</strong>? Dejará de
        aparecer en el catálogo, pero no se elimina: conserva su historial.
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <Boton variante="secundario" onClick={onCancelar} disabled={anulando}>
          Cancelar
        </Boton>
        <Boton variante="peligro" onClick={onConfirmar} disabled={anulando}>
          {anulando ? 'Anulando…' : 'Anular producto'}
        </Boton>
      </div>
    </Modal>
  )
}

export default ConfirmarAnularModal
