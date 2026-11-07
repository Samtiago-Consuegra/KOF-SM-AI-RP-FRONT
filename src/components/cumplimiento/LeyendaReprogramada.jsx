import { History } from 'lucide-react'
import Tooltip from './Tooltip.jsx'
import { formatFechaHabil } from '../../utils/weeks.js'

function formatFechaCorta(iso) {
  if (!iso) return '—'
  return formatFechaHabil(iso) || '—'
}

function motivoTexto(motivo) {
  if (motivo === 'vencida') return 'Parada vencida'
  if (motivo === 'tareas-restantes') return 'Tareas restantes'
  return 'Reprogramación'
}

/**
 * Leyenda estilo EstadoArchivos: icono History en tertiary, texto truncado con
 * tooltip e historial completo. Si recibe onVerHistorial se comporta como botón.
 */
export default function LeyendaReprogramada({ parada, onVerHistorial, className = '' }) {
  if (!parada) return null

  const historial = parada.historialReprogramaciones || []
  const destino = parada.reprogramadaAFecha
  if (!destino && historial.length === 0) return null

  const texto = destino
    ? `Reprogramada al ${formatFechaHabil(destino)}`
    : `Reprogramada ${historial.length} ${historial.length === 1 ? 'vez' : 'veces'}`

  const detalle = (
    <span className="block space-y-2">
      <span className="block font-semibold text-ink-900">Historial de reprogramaciones</span>
      {historial.length === 0 ? (
        <span className="block text-ink-500">Sin registros de historial.</span>
      ) : (
        <span className="block space-y-2">
          {historial
            .slice()
            .reverse()
            .map((item, index) => (
              <span key={`${item.registradaEl || item.fechaNueva}-${index}`} className="block border-t border-neutral-200 pt-2 first:border-0 first:pt-0">
                <span className="block font-medium text-ink-800">
                  {formatFechaCorta(item.fechaOriginal)} → {formatFechaCorta(item.fechaNueva)}
                </span>
                <span className="block text-ink-500">
                  {motivoTexto(item.motivo)}
                  {typeof item.avance === 'number' ? ` · ${item.avance}% de avance` : ''}
                  {typeof item.tareasPendientes === 'number' ? ` · ${item.tareasPendientes} tarea(s) pendiente(s)` : ''}
                </span>
                <span className="block text-ink-400">Registrada el {formatFechaCorta(item.registradaEl)}</span>
              </span>
            ))}
        </span>
      )}
    </span>
  )

  const contenido = (
    <>
      <History className="size-3.5 shrink-0 text-tertiary-600" aria-hidden="true" />
      <span className="min-w-0 truncate">{texto}</span>
    </>
  )

  const vista = onVerHistorial ? (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation()
        onVerHistorial(parada)
      }}
      className="flex min-w-0 max-w-full items-center gap-1.5 text-left text-xs font-medium text-tertiary-700 hover:text-tertiary-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 rounded"
      aria-label={`Ver historial de reprogramaciones de ${parada.titulo}`}
    >
      {contenido}
    </button>
  ) : (
    <span className="flex min-w-0 max-w-full items-center gap-1.5 text-xs font-medium text-tertiary-700">
      {contenido}
    </span>
  )

  return (
    <Tooltip content={detalle} width="w-80" className={`max-w-full ${className}`}>
      {vista}
    </Tooltip>
  )
}
