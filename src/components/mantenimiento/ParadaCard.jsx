import { Factory, ListChecks } from 'lucide-react'
import CondicionParadaBadge from './CondicionParadaBadge.jsx'
import { resumenMaquinas, textoMaquinas } from '../../utils/paradas.js'

const COLORS = {
  'Preventiva': { border: 'border-l-tertiary-600', bg: 'bg-tertiary-50' },
  'Correctiva': { border: 'border-l-primary-500', bg: 'bg-primary-50' },
  'Predictiva': { border: 'border-l-ink-900', bg: 'bg-ink-50' },
  'Predictiva o sugerida por el sistema': { border: 'border-l-ink-900', bg: 'bg-ink-50' },
  'Parada de producción (limpieza, cambio de formato)': { border: 'border-l-neutral-400', bg: 'bg-neutral-100' },
}

export default function ParadaCard({ parada, onClick }) {
  const c = COLORS[parada.tipo] || COLORS['Preventiva']
  const tareas = parada.tareas || []
  const count = parada.tareasDetalle?.length || tareas.length
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onClick?.(parada)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(parada) } }}
      className={"rounded-lg border border-neutral-200 border-l-3 " + c.border + " " + c.bg + " p-2 cursor-pointer hover:shadow-sm active:scale-[0.98] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"}
      title={(parada.tareasDetalle || tareas).map(t => typeof t === 'string' ? t : t.descripcion).join('\n')}
    >
      <p className="flex items-center justify-between gap-1 text-xs text-ink-600">
        <span>{parada.horaInicio} – {parada.horaFin}</span>
        <CondicionParadaBadge condicion={parada.condicion} iconOnly />
      </p>
      <p className="text-sm font-medium text-ink-900 line-clamp-2">{parada.titulo}</p>
      <div className="mt-1 flex items-center justify-between gap-1 text-xs text-ink-600">
        <span className="flex min-w-0 items-center gap-1" title={textoMaquinas(parada) || 'Sin máquina'}>
          <Factory className="size-3 shrink-0" aria-hidden="true" />
          <span className="truncate">{resumenMaquinas(parada)}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1">
          <ListChecks className="size-3" aria-hidden="true" /> {count}
        </span>
      </div>
    </div>
  )
}
