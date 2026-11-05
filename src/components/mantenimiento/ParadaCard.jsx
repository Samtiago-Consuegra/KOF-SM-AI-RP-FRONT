import { ListChecks } from 'lucide-react'

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
      <p className="text-xs text-ink-600">{parada.horaInicio} – {parada.horaFin}</p>
      <p className="text-sm font-medium text-ink-900 line-clamp-2">{parada.titulo}</p>
      <p className="mt-1 flex items-center gap-1 text-xs text-ink-600"><ListChecks className="size-3" /> {count} tareas</p>
    </div>
  )
}
