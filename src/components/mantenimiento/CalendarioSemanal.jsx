import { useState } from 'react'
import { ListChecks } from 'lucide-react'
import ParadaCard from './ParadaCard.jsx'

const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

function addDays(iso, n) {
  const d = new Date(iso + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

function esHoy(iso) {
  return iso === new Date().toISOString().slice(0, 10)
}

export default function CalendarioSemanal({ paradas = [], week, onParadaClick }) {
  const [exp, setExp] = useState({})
  if (!week) return null
  const dias = Array.from({ length: 7 }, (_, i) => {
    const iso = addDays(week.start, i)
    const d = new Date(iso + 'T00:00:00')
    const lista = paradas.filter((p) => p.fecha === iso).sort((a,b)=>a.horaInicio.localeCompare(b.horaInicio))
    return { iso, label: DIAS[i] + ' ' + iso.slice(8,10), hoy: esHoy(iso), lista }
  })

  return (
    <div>
      <div className="hidden md:grid grid-cols-7 divide-x divide-neutral-200">
        {dias.map((dia) => (
          <div key={dia.iso} className="min-h-[220px]">
            <div className="px-3 py-2 border-b border-neutral-200 text-sm">
              <span className={dia.hoy ? 'text-primary-600 font-medium' : 'text-ink-700'}>{dia.label}</span>
              {dia.hoy && <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-primary-500 align-middle" />}
            </div>
            <div className="p-2 space-y-2">
              {dia.lista.length === 0 && <p className="text-xs text-ink-400 px-1">Sin paradas</p>}
              {(exp[dia.iso] ? dia.lista : dia.lista.slice(0,3)).map((p) => <ParadaCard key={p.id} parada={p} onClick={onParadaClick} />)}
              {dia.lista.length > 3 && !exp[dia.iso] && (
                <button onClick={() => setExp((e)=>({...e,[dia.iso]:true}))} className="text-xs text-ink-500 hover:text-ink-700">+{dia.lista.length - 3} más</button>
              )}
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
      <div className="px-4 py-2 border-t border-neutral-200 flex flex-wrap items-center gap-4 text-xs text-ink-500">
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-tertiary-600" /> Preventiva</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-primary-500" /> Correctiva</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-ink-900" /> Predictiva o sugerida</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-neutral-400" /> Parada de producción</span>
      </div>
    </div>
  )
}
