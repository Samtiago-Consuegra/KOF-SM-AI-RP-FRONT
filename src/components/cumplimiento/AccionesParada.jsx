import { ClipboardCheck, Eye, RefreshCw } from 'lucide-react'

/**
 * Acción contextual según el estado efectivo de la parada.
 * No hay acciones para estados desconocidos.
 */
export default function AccionesParada({ parada, onRegistrar, onReprogramar, onVerDetalle, className = '' }) {
  if (!parada) return null

  const base =
    'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 whitespace-nowrap'
  const stop = (fn) => (event) => {
    event.stopPropagation()
    fn?.(parada)
  }

  if (parada.estado === 'Vencida') {
    return (
      <button
        type="button"
        onClick={stop(onReprogramar)}
        aria-label={`Reprogramar ${parada.titulo}`}
        className={`${base} border-tertiary-200 bg-tertiary-50 text-tertiary-700 hover:bg-tertiary-100 ${className}`}
      >
        <RefreshCw className="size-3.5" aria-hidden="true" />
        Reprogramar
      </button>
    )
  }

  if (parada.estado === 'Cumplida') {
    return (
      <button
        type="button"
        onClick={stop(onVerDetalle)}
        aria-label={`Ver detalle de ${parada.titulo}`}
        className={`${base} border-neutral-200 bg-white text-ink-700 hover:bg-neutral-50 ${className}`}
      >
        <Eye className="size-3.5" aria-hidden="true" />
        Ver detalle
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={stop(onRegistrar)}
      aria-label={`Registrar seguimiento de ${parada.titulo}`}
      className={`${base} border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 ${className}`}
    >
      <ClipboardCheck className="size-3.5" aria-hidden="true" />
      Registrar seguimiento
    </button>
  )
}
