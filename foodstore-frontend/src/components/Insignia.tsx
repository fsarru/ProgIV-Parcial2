import type { ReactNode } from 'react'

type Tono = 'verde' | 'gris' | 'azul' | 'rojo' | 'naranja'

interface InsigniaProps {
  tono: Tono
  children: ReactNode
}

const tonos: Record<Tono, string> = {
  verde: 'bg-emerald-100 text-emerald-800 ring-emerald-200',
  gris: 'bg-slate-100 text-slate-600 ring-slate-200',
  azul: 'bg-sky-100 text-sky-800 ring-sky-200',
  rojo: 'bg-red-100 text-red-800 ring-red-200',
  naranja: 'bg-orange-100 text-orange-800 ring-orange-200',
}

function Insignia({ tono, children }: InsigniaProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${tonos[tono]}`}
    >
      {children}
    </span>
  )
}

export default Insignia
