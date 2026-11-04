import { useEffect, useId } from 'react'
import type { ReactNode } from 'react'

interface ModalProps {
  titulo: string
  onCerrar: () => void
  /** Mientras está bloqueado no se puede cerrar (por ejemplo, al guardar). */
  bloqueado?: boolean
  children: ReactNode
}

function Modal({ titulo, onCerrar, bloqueado = false, children }: ModalProps) {
  const tituloId = useId()

  useEffect(() => {
    function alPresionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape' && !bloqueado) onCerrar()
    }
    document.addEventListener('keydown', alPresionarTecla)
    return () => document.removeEventListener('keydown', alPresionarTecla)
  }, [bloqueado, onCerrar])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-slate-900/50"
        onClick={() => {
          if (!bloqueado) onCerrar()
        }}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={tituloId}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
      >
        <h2 id={tituloId} className="text-xl font-semibold text-slate-900">
          {titulo}
        </h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

export default Modal
