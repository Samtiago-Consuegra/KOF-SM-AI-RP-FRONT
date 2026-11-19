import { Check } from 'lucide-react'

// Mismos colores que la leyenda del calendario.
export const TIPO_ORDEN_COLOR = {
  Preventiva: 'bg-tertiary-600',
  Correctiva: 'bg-primary-500',
  Emergencia: 'bg-primary-500',
  Predictiva: 'bg-ink-900',
  otro: 'bg-neutral-400',
}

const ESTADO_BADGE = {
  'Ejecutada': 'border-tertiary-200 bg-tertiary-50 text-tertiary-700',
  'No ejecutada': 'border-primary-200 bg-primary-50 text-primary-700',
  'Abierta': 'border-neutral-200 bg-neutral-100 text-ink-600',
}

export function EstadoOrdenBadge({ estado }) {
  return (
    <span className={`inline-flex items-center gap-0.5 whitespace-nowrap rounded-full border px-1.5 py-px text-[10px] font-medium ${ESTADO_BADGE[estado] || ESTADO_BADGE.Abierta}`}>
      {estado === 'Ejecutada' && <Check className="size-3" aria-hidden="true" />}
      {estado}
    </span>
  )
}

/** Tarjeta compacta de una orden de trabajo SAP (calendario de semanas pasadas). */
export default function OrdenSapCard({ orden, onClick, indice = 0 }) {
  return (
    <button
      type="button"
      onClick={() => onClick?.(orden)}
      aria-label={`Orden ${orden.orden}, ${orden.tipo}, ${orden.maquina}, ${orden.estado}`}
      style={{ animationDelay: `${Math.min(indice, 8) * 30}ms` }}
      className="orden-sap-card group relative flex w-full gap-2 overflow-hidden rounded-lg border border-neutral-200 bg-white py-1.5 pl-2.5 pr-2 text-left hover:border-neutral-300 hover:bg-[#F8F9FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
    >
      <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1 ${TIPO_ORDEN_COLOR[orden.tipo] || TIPO_ORDEN_COLOR.otro}`} />
      <span className="min-w-0 flex-1">
        <span className="flex items-center justify-between gap-1">
          <span className="truncate text-[11px] font-semibold text-ink-900">{orden.maquina || 'Sin máquina'}</span>
          <EstadoOrdenBadge estado={orden.estado} />
        </span>
        <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-ink-600">{orden.texto || `Orden ${orden.orden}`}</span>
      </span>
    </button>
  )
}
