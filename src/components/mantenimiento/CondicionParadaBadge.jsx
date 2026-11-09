import { Flame, Snowflake } from 'lucide-react'
import { CONDICION_PARADA } from '../../utils/paradas.js'

export default function CondicionParadaBadge({ condicion, compact = false, iconOnly = false, className = '' }) {
  const cfg = CONDICION_PARADA[condicion]
  if (!cfg) {
    return (
      <span className={`inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-100 px-2 py-0.5 text-xs text-ink-500 ${className}`}>
        Sin definir
      </span>
    )
  }

  const Icon = condicion === 'frio' ? Snowflake : Flame

  if (iconOnly) {
    return (
      <span
        className={`inline-grid size-4 place-items-center rounded ${cfg.iconWrap} ${className}`}
        title={cfg.label}
        aria-label={cfg.label}
      >
        <Icon className="size-3" aria-hidden="true" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badge} ${className}`}
      title={cfg.descripcion}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {compact ? cfg.short : cfg.label}
    </span>
  )
}
