import { HardHat, Users } from 'lucide-react'
import { EJECUCION_OPCIONES } from '../../utils/paradas.js'
import { labelCls } from './modalFormStyles.js'

const ICONS = { propio: Users, contratista: HardHat }
const ACTIVO = {
  propio: 'border-tertiary-300 bg-tertiary-50 text-tertiary-700',
  contratista: 'border-ink-900 bg-ink-900 text-white',
}

/** Quién realiza los trabajos de la parada: "propio" | "contratista". Mismo formato que CondicionSelector. */
export default function EjecucionSelector({ value, onChange, className = '', conEtiqueta = true }) {
  return (
    <div className={className}>
      <style>{`
        @keyframes ejec-pop { from { transform: scale(0.7); } to { transform: none; } }
        .ejec-icon-on { animation: ejec-pop 180ms cubic-bezier(0.22, 1, 0.36, 1); }
        .ejec-btn { transition: background-color 200ms ease, border-color 200ms ease, color 200ms ease, box-shadow 200ms ease; touch-action: manipulation; }
        .ejec-btn:active { transform: scale(0.98); }
        @media (prefers-reduced-motion: reduce) { .ejec-icon-on { animation: none; } .ejec-btn:active { transform: none; } }
      `}</style>
      {conEtiqueta && <span className={labelCls}>Ejecución</span>}
      <div role="radiogroup" aria-label="Ejecución" className="grid grid-cols-2 gap-2">
        {EJECUCION_OPCIONES.map((opcion) => {
          const Icon = ICONS[opcion.value]
          const active = value === opcion.value
          return (
            <button
              key={opcion.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange?.(opcion.value)}
              className={`ejec-btn inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${active ? `${ACTIVO[opcion.value]} font-semibold shadow-sm` : 'border-neutral-200 bg-white text-ink-600 hover:bg-neutral-50'}`}
            >
              <Icon key={String(active)} className={`size-4 ${active ? 'ejec-icon-on' : ''}`} aria-hidden="true" />
              {opcion.label}
            </button>
          )
        })}
      </div>
      {conEtiqueta && <p className="mt-1 text-[11px] text-ink-400">¿Quién realiza los trabajos?</p>}
    </div>
  )
}
