import Dropdown from '../ui/Dropdown.jsx'
import { ChevronDown } from 'lucide-react'

/**
 * Select de Componente de la cascada Sistema → Componente.
 * Siempre visible: sin sistema se muestra deshabilitado con el texto "Elige un sistema".
 */
export default function ComponenteSelect({ value, onChange, options = [] }) {
  const habilitado = options.length > 0

  return (
    <div className="w-full md:w-44">
      <span id="filtro-componente-label" className="block text-xs font-medium text-ink-500 mb-1.5">Componente</span>
      {habilitado ? (
        <Dropdown
          variant="toolbar"
          value={value}
          onChange={onChange}
          options={[
            { value: '', label: 'Todos los componentes' },
            ...options.map((c) => ({ value: c.id, label: c.nombre })),
          ]}
          renderValue={(o) => <span className="font-medium">{o?.label ?? 'Todos los componentes'}</span>}
        />
      ) : (
        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-describedby="filtro-componente-label"
          title="Elige un sistema para ver sus componentes"
          className="flex h-10 w-full cursor-not-allowed items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 text-sm text-ink-400"
        >
          <span className="flex-1 truncate text-left">Elige un sistema</span>
          <ChevronDown className="size-4 shrink-0 text-ink-300" aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
