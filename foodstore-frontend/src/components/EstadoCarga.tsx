const TARJETAS_ESQUELETO = [1, 2, 3, 4, 5, 6]

function EstadoCarga() {
  return (
    <div role="status" aria-busy="true" aria-label="Cargando productos">
      <p className="mb-4 text-sm text-slate-500">Cargando productos…</p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TARJETAS_ESQUELETO.map((n) => (
          <div
            key={n}
            className="h-52 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
          >
            <div className="h-4 w-2/3 rounded bg-slate-200" />
            <div className="mt-3 h-3 w-full rounded bg-slate-100" />
            <div className="mt-6 h-6 w-1/3 rounded bg-slate-200" />
            <div className="mt-4 flex gap-2">
              <div className="h-5 w-20 rounded-full bg-slate-100" />
              <div className="h-5 w-20 rounded-full bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EstadoCarga
