import { ClipboardList, Sparkles, User } from 'lucide-react'

const GRIS = 'border-neutral-200 bg-neutral-100 text-ink-600'

const ESTILOS = {
  'Plan SAP': { cls: 'border-blue-200 bg-blue-50 text-blue-700', Icon: ClipboardList },
  'Recomendación del motor': { cls: 'border-tertiary-200 bg-tertiary-50 text-tertiary-700', Icon: Sparkles },
  'Registrada por el usuario': { cls: GRIS, Icon: User },
}

/** Insignia de dónde sale una tarea (el motor manda el texto en Origen). */
export default function OrigenBadge({ origen, className = '' }) {
  if (!origen) return null
  const { cls, Icon } = ESTILOS[origen] || { cls: GRIS, Icon: null }
  return (
    <span
      className={`origen-badge inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium ${cls} ${className}`}
    >
      <style>{`
        @keyframes origen-in { from { opacity: 0; transform: scale(.92); } to { opacity: 1; transform: none; } }
        .origen-badge { animation: origen-in 200ms cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .origen-badge { animation: none !important; } }
      `}</style>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {origen}
    </span>
  )
}
