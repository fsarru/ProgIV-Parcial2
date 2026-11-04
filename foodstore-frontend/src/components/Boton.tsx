import type { ButtonHTMLAttributes } from 'react'

type Variante = 'primario' | 'secundario' | 'advertencia' | 'peligro'
type Tamano = 'sm' | 'md'

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors ' +
  'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

const variantes: Record<Variante, string> = {
  primario:
    'bg-orange-600 text-white hover:bg-orange-700 focus-visible:ring-orange-500 disabled:hover:bg-orange-600',
  secundario:
    'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-400 disabled:hover:bg-white',
  advertencia:
    'bg-amber-100 text-amber-900 hover:bg-amber-200 focus-visible:ring-amber-400 disabled:hover:bg-amber-100',
  peligro:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500 disabled:hover:bg-red-600',
}

const tamanos: Record<Tamano, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
}

function Boton({
  variante = 'primario',
  tamano = 'md',
  className = '',
  type = 'button',
  ...resto
}: BotonProps) {
  return (
    <button
      type={type}
      className={`${base} ${variantes[variante]} ${tamanos[tamano]} ${className}`}
      {...resto}
    />
  )
}

export default Boton
