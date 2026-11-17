import { HardHat, Users } from 'lucide-react'
import { EJECUCION_PARADA, ejecucionValida } from '../../utils/paradas.js'

/** Vista de solo lectura de la ejecución de una parada. `iconOnly` solo pinta el casco del contratista. */
export default function EjecucionBadge({ ejecucion, iconOnly = false, className = '' }) {
  const valor = ejecucionValida(ejecucion)
  const cfg = EJECUCION_PARADA[valor]
  const Icon = valor === 'contratista' ? HardHat : Users
  const anim = (
    <style>{`
      @keyframes ejec-badge-in { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: none; } }
      .ejec-badge { animation: ejec-badge-in 160ms cubic-bezier(0.22, 1, 0.36, 1) both; }
      @media (prefers-reduced-motion: reduce) { .ejec-badge { animation: none; } }
    `}</style>
  )

  if (iconOnly) {
    if (valor !== 'contratista') return null
    return (
      <span className={`ejec-badge inline-grid size-4 place-items-center rounded bg-ink-900 text-white ${className}`} title="Contratista" aria-label="Contratista" role="img">
        {anim}
        <HardHat className="size-3" aria-hidden="true" />
      </span>
    )
  }

  return (
    <span className={`ejec-badge inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${cfg.badge} ${className}`}>
      {anim}
      <Icon className="size-3.5" aria-hidden="true" />
      {cfg.label}
    </span>
  )
}
