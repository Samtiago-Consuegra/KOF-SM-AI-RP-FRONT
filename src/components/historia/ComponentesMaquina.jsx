import { Link } from 'react-router-dom'

const NIVEL_BADGE = {
  'Crítico': 'bg-primary-50 text-primary-600',
  'Alto': 'bg-primary-100 text-primary-800',
  'Medio': 'bg-ink-100 text-ink-700',
  'Sin nivel': 'bg-neutral-100 text-ink-500',
}

function Skeleton() {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
      <div className="h-6 w-48 animate-pulse rounded bg-neutral-100" />
      <div className="mt-4 space-y-3">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-20 w-full animate-pulse rounded-xl bg-neutral-50" />)}
      </div>
    </div>
  )
}

export default function ComponentesMaquina({ componentes, loading, maquina, periodoKey }) {
  if (loading || !componentes) return <Skeleton />

  return (
    <div key={`${maquina}-${periodoKey}`} className="rounded-2xl border border-neutral-200 bg-white shadow-sm animate-[fade-swap-in_250ms_ease-out]">
      <div className="p-6">
        <h2 className="text-lg font-semibold text-ink-900">Componentes de la máquina</h2>
        <div className="mt-4 space-y-2">
          {componentes.length === 0 ? (
            <p className="rounded-xl bg-neutral-50 p-4 text-sm text-ink-500">Sin fallas registradas en el periodo.</p>
          ) : (
            componentes.map((c, i) => (
              <div
                key={c.id}
                className="rounded-xl border border-neutral-200 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-sm animate-[fade-swap-in_250ms_ease-out_both]"
                style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-ink-900 truncate">{c.nombre}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${NIVEL_BADGE[c.nivel] ?? NIVEL_BADGE['Sin nivel']}`}>
                    {c.nivel}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-ink-500">
                  {c.fallas} fallas
                  {' · '}
                  {c.mtbf ? `MTBF ${c.mtbf} h` : 'Datos insuficientes para MTBF'}
                  {c.ultimoEvento && <> · Último evento {new Date(`${c.ultimoEvento}T12:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' })}</>}
                </div>
              </div>
            ))
          )}
        </div>
        <div className="mt-4">
          <Link
            to="/predicciones"
            className="text-sm font-medium text-primary-600 underline underline-offset-2 transition-colors hover:text-primary-700"
          >
            Ver confiabilidad por componente
          </Link>
        </div>
      </div>
    </div>
  )
}
