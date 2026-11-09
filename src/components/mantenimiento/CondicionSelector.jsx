import { Flame, Snowflake } from 'lucide-react'
import { CONDICION_OPTIONS } from '../../utils/paradas.js'

const ICONS = { frio: Snowflake, caliente: Flame }

export default function CondicionSelector({ value, onChange, className = '' }) {
  return (
    <div role="radiogroup" aria-label="Condición de la parada" className={`grid grid-cols-2 gap-2 ${className}`}>
      {CONDICION_OPTIONS.map((opcion) => {
        const Icon = ICONS[opcion.value]
        const active = value === opcion.value
        return (
          <button
            key={opcion.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange?.(opcion.value)}
            title={opcion.descripcion}
            className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${active ? `${opcion.badge} font-semibold shadow-sm` : 'border-neutral-200 bg-white text-ink-600 hover:bg-neutral-50'}`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {opcion.label}
          </button>
        )
      })}
    </div>
  )
}
