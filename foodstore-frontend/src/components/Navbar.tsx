import Boton from './Boton'

interface NavbarProps {
  onNuevoProducto: () => void
  deshabilitarAlta: boolean
}

function Navbar({ onNuevoProducto, deshabilitarAlta }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3"
        aria-label="Navegación principal"
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-sm font-bold text-white"
            aria-hidden="true"
          >
            FS
          </span>
          <div className="leading-tight">
            <p className="text-base font-semibold text-slate-900">Food Store</p>
            <p className="text-xs text-slate-500">Administración del catálogo</p>
          </div>
        </div>
        <Boton onClick={onNuevoProducto} disabled={deshabilitarAlta}>
          + Nuevo producto
        </Boton>
      </nav>
    </header>
  )
}

export default Navbar
