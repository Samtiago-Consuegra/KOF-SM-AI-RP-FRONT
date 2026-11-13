import ParadaCard from './ParadaCard.jsx'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function esHoy(iso) {
  // Fecha local (no UTC): en Colombia, después de las 19:00 UTC ya sería "mañana".
  const d = new Date()
  const local = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return iso === local
}

export default function CalendarioSemanal({ paradas = [], week, onParadaClick, dir = 0 }) {
  if (!week) return null
  const dias = Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(week.start, i)
    const d = new Date(iso + 'T00:00:00')
    const lista = paradas.filter((p) => p.fecha === iso).sort((a,b)=>a.horaInicio.localeCompare(b.horaInicio))
    return { iso, label: DIAS[i] + ' ' + iso.slice(8,10), hoy: esHoy(iso), lista }
  })

  return (
    <div>
      <style>{`
        @keyframes sem-in-left { from { opacity: 0; transform: translateX(-16px); } to { opacity: 1; transform: none; } }
        @keyframes sem-in-right { from { opacity: 0; transform: translateX(16px); } to { opacity: 1; transform: none; } }
        .sem-slide[data-dir="-1"] { animation: sem-in-left 260ms cubic-bezier(.2,.8,.2,1) both; }
        .sem-slide[data-dir="1"] { animation: sem-in-right 260ms cubic-bezier(.2,.8,.2,1) both; }
        @media (prefers-reduced-motion: reduce) { .sem-slide { animation: none !important; } }
      `}</style>
      <div key={week.start} className="sem-slide overflow-hidden" data-dir={dir}>
      {/* Una sola fila de grid: las 7 columnas crecen juntas hasta el día con más paradas. */}
      <div className="hidden md:grid grid-cols-7 auto-rows-auto items-stretch divide-x divide-neutral-200">
        {dias.map((dia) => (
          <div key={dia.iso} className="min-h-[220px] min-w-0">
            <div className="px-3 py-2 border-b border-neutral-200 text-sm">
              <span className={dia.hoy ? 'text-primary-600 font-medium' : 'text-ink-700'}>{dia.label}</span>
              {dia.hoy && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary-500 align-middle" />}
            </div>
            <div className="p-2 space-y-2">
              {dia.lista.length === 0 && <p className="text-xs text-ink-400 px-1">Sin paradas</p>}
              {dia.lista.map((p) => <ParadaCard key={p.id} parada={p} onClick={onParadaClick} />)}
            </div>
          </div>
        ))}
      </div>
      <div className="md:hidden divide-y divide-neutral-200">
        {dias.map((dia) => (
          <details key={dia.iso} className="group" open={dia.hoy}>
            <summary className="flex items-center justify-between px-4 py-2 cursor-pointer">
              <span className={dia.hoy ? 'text-primary-600 font-medium' : 'text-ink-700'}>{dia.label}</span>
              <span className="text-xs text-ink-400">{dia.lista.length} paradas</span>
            </summary>
            <div className="px-3 pb-3 space-y-2">
              {dia.lista.length === 0 && <p className="text-xs text-ink-400">Sin paradas</p>}
              {dia.lista.map((p) => <ParadaCard key={p.id} parada={p} onClick={onParadaClick} />)}
            </div>
          </details>
        ))}
      </div>
      </div>
      <div className="px-4 py-2 border-t border-neutral-200 flex flex-wrap items-center gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-tertiary-600" /> Preventiva</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-primary-500" /> Correctiva</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-ink-900" /> Predictiva o sugerida</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neutral-400" /> Parada de producción</span>
        <span className="hidden h-4 w-px bg-neutral-200 sm:inline-block" />
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-blue-500" /> En frío</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-orange-500" /> En caliente</span>
      </div>
    </div>
  )
}
