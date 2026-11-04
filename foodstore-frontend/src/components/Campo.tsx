import type { ReactNode } from 'react'

interface CampoProps {
  etiqueta: string
  htmlFor: string
  error?: string
  ayuda?: string
  children: ReactNode
}

function Campo({ etiqueta, htmlFor, error, ayuda, children }: CampoProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-slate-700">
        {etiqueta}
      </label>
      {children}
      {ayuda && !error && <p className="mt-1 text-xs text-slate-500">{ayuda}</p>}
      {error && (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export default Campo
