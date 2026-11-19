import { useRef } from 'react'
import { CalendarCheck, ClipboardList } from 'lucide-react'
import { VISTAS } from '../../services/ordenesSapCumplimiento.js'

const OPCIONES = [
  { value: VISTAS.PARADAS, label: 'Paradas programadas', Icon: CalendarCheck },
  { value: VISTAS.SAP, label: 'Órdenes de SAP', Icon: ClipboardList },
]

/** Selector segmentado (estilo CondicionSelector) con indicador que se desliza a la opción activa. */
export default function VistaSelector({ value, onChange, className = '' }) {
  const refs = useRef([])
  const activo = Math.max(0, OPCIONES.findIndex((o) => o.value === value))

  const onKeyDown = (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    e.preventDefault()
    const siguiente = (activo + (e.key === 'ArrowRight' ? 1 : -1) + OPCIONES.length) % OPCIONES.length
    onChange?.(OPCIONES[siguiente].value)
    refs.current[siguiente]?.focus()
  }

  return (
    <div role="radiogroup" aria-label="Datos de cumplimiento" onKeyDown={onKeyDown} className={`relative grid w-full max-w-md grid-cols-2 gap-2 ${className}`}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-0 w-[calc(50%-4px)] rounded-lg border border-tertiary-200 bg-tertiary-50 shadow-sm transition-transform duration-[250ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
        style={{ transform: activo ? 'translateX(calc(100% + 8px))' : 'none' }}
      />
      {OPCIONES.map(({ value: v, label, Icon }, i) => {
        const active = i === activo
        return (
          <button
            key={v}
            ref={(el) => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange?.(v)}
            className={`relative inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border text-sm transition-colors [touch-action:manipulation] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400 ${active ? 'border-transparent font-semibold text-tertiary-700' : 'border-neutral-200 bg-white text-ink-600 hover:bg-neutral-50'}`}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </button>
        )
      })}
    </div>
  )
}
