import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

// Estilos del botón según el contexto (barra de filtros, formularios)
const BUTTON_VARIANTS = {
  default: 'border border-neutral-200 bg-neutral-50 hover:bg-white px-3.5 py-2.5',
  toolbar: 'h-10 border border-neutral-200 bg-white hover:bg-neutral-100 px-3.5',
}

/**
 * Dropdown accesible con grupos opcionales.
 * options: [{ value, label, hint?, group?, dot? }]
 */
export default function Dropdown({ label, value, onChange, options, className = '', renderValue, variant = 'default' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const id = useId()
  const current = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e) => { if (!ref.current?.contains(e.target)) setOpen(false) }
    const esc = (e) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', close)
    document.addEventListener('keydown', esc)
    return () => { document.removeEventListener('mousedown', close); document.removeEventListener('keydown', esc) }
  }, [open])

  const groups = [...new Set(options.map((o) => o.group ?? ''))]

  return (
    <div ref={ref} className={`relative ${className}`}>
      {label && <span id={`${id}-l`} className="block text-xs font-medium text-ink-500 mb-1.5">{label}</span>}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label ? `${id}-l` : undefined}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 rounded-xl text-sm text-left transition-colors ${BUTTON_VARIANTS[variant] ?? BUTTON_VARIANTS.default}`}
      >
        <span className="flex-1 truncate">{renderValue ? renderValue(current) : current?.label}</span>
        <ChevronDown className={`size-4 text-ink-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <ul role="listbox" className="absolute z-30 mt-2 w-full min-w-64 max-h-80 overflow-auto scroll-thin rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
          {groups.map((g) => (
            <li key={g || 'default'} role="presentation">
              {g && <p className="px-2.5 pt-2 pb-1 text-[11px] font-semibold text-ink-400">{g}</p>}
              <ul role="group">
                {options.filter((o) => (o.group ?? '') === g).map((o) => {
                  const selected = o.value === value
                  return (
                    <li key={o.value}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => { onChange(o.value); setOpen(false) }}
                        className={`w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm text-left ${selected ? 'bg-primary-50 text-primary-700' : 'hover:bg-neutral-100 text-ink-800'}`}
                      >
                        {o.dot && <span className={`size-2 rounded-full ${o.dot}`} />}
                        <span className="flex-1 min-w-0">
                          <span className="block truncate font-medium">{o.label}</span>
                          {o.hint && <span className="block truncate text-xs text-ink-500">{o.hint}</span>}
                        </span>
                        {selected && <Check className="size-4" />}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
