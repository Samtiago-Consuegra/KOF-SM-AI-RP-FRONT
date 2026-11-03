import { Link } from 'react-router-dom'

export default function ComponentesMaquina({ componentes, loading }) {
  if (loading) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-40 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 space-y-2">
          {[1,2,3,4].map(i => <div key={i} className="h-20 animate-pulse rounded-xl bg-neutral-50" />)}
        </div>
      </div>
    )
  }
  
  const getNivelBadge = (nivel) => {
    if (nivel === 'Crítico') return 'bg-primary-50 text-primary-600'
    if (nivel === 'Alto') return 'bg-primary-100 text-primary-800'
    if (nivel === 'Medio') return 'bg-ink-100 text-ink-700'
    return 'bg-neutral-100 text-ink-500'
  }
  
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-ink-900">Componentes de la máquina</h3>
        <div className="mt-4 space-y-2">
          {componentes.map((comp) => (
            <div key={comp.nombre} className="rounded-xl border border-neutral-200 p-3 transition-all hover:border-primary-200 hover:shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-ink-900">{comp.nombre}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${getNivelBadge(comp.nivel)}`}>{comp.nivel}</span>
              </div>
              <div className="mt-1 text-xs text-ink-500">
                {comp.fallas} fallas · {comp.mtbf ? `MTBF ${comp.mtbf}h` : 'Datos insuficientes para MTBF'} · Último evento {new Date(comp.ultimoEvento).toLocaleDateString('es-ES')}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Link to="/predicciones" className="text-sm font-medium text-primary-600 underline hover:text-primary-700">
            Ver confiabilidad por componente
          </Link>
        </div>
      </div>
    </div>
  )
}
