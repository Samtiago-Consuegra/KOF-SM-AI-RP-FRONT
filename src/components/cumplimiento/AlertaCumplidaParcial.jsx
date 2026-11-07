import { AlertTriangle, Circle } from 'lucide-react'
import Tooltip from './Tooltip.jsx'

/**
 * Alerta de cumplimiento parcial: la parada quedó Cumplida pero conserva
 * tareas sin ejecutar. compact = una línea para la tabla.
 */
export default function AlertaCumplidaParcial({ parada, compact = false }) {
  if (!parada) return null

  const tareas = parada.tareas || []
  const pendientes = tareas.filter((t) => !t.completada)
  const total = tareas.length
  const hechas = total - pendientes.length
  const avance = typeof parada.avanceAlCumplir === 'number'
    ? parada.avanceAlCumplir
    : total === 0
      ? 0
      : Math.round((hechas / total) * 100)

  if (pendientes.length === 0) return null

  const detalle = (
    <span className="block space-y-1.5">
      <span className="block font-semibold text-ink-900">Tareas pendientes al cumplir</span>
      {pendientes.map((t) => (
        <span key={t.id} className="flex items-start gap-1.5 text-ink-600">
          <Circle className="mt-1 size-2.5 shrink-0 text-primary-500" aria-hidden="true" />
          <span className="min-w-0">
            <span className="block font-medium text-ink-800">{t.nombre}</span>
            <span className="block text-ink-500">{t.componente}</span>
          </span>
        </span>
      ))}
    </span>
  )

  if (compact) {
    return (
      <Tooltip content={detalle} width="w-72" className="max-w-full">
        <button
          type="button"
          onClick={(event) => event.stopPropagation()}
          aria-label={`Ver las ${pendientes.length} tareas pendientes al cumplir`}
          className="inline-flex max-w-full items-center gap-1.5 text-[11px] font-semibold text-primary-600 hover:text-primary-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded"
        >
          <AlertTriangle className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{pendientes.length} tarea(s) pendiente(s)</span>
        </button>
      </Tooltip>
    )
  }

  return (
    <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-3">
      <div className="flex items-start gap-2.5">
        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-primary-100 text-primary-600">
          <AlertTriangle className="size-4" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-primary-700">Cumplida con tareas pendientes</p>
          <p className="mt-0.5 text-xs text-primary-700/80">
            {hechas} de {total} tareas ejecutadas · {avance}% de avance
          </p>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-primary-100">
            <div
              className="h-full rounded-full bg-primary-500"
              style={{ width: `${Math.min(100, Math.max(0, avance))}%` }}
            />
          </div>
          <ul className="mt-2.5 space-y-1.5">
            {pendientes.map((t) => (
              <li key={t.id} className="flex items-start gap-1.5 text-xs text-ink-700">
                <Circle className="mt-0.5 size-2.5 shrink-0 text-primary-500" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="font-medium text-ink-800">{t.nombre}</span>
                  <span className="text-ink-500"> · {t.componente}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
