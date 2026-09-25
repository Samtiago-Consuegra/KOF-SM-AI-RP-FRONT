import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, Bolt, Cpu, Droplets, Download, Gauge, ShieldCheck, Thermometer, Vibrate, Info, ChevronLeft, ChevronRight } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import UploadExcelButton from '../components/ui/UploadExcelButton.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import MachineFilter from '../components/ui/MachineFilter.jsx'
import Sparkline from '../components/ui/Sparkline.jsx'
import { MACHINES, resolveMachineFilter } from '../data/machines.js'
import { RANGE_OPTIONS, RISK_LEVELS, getPredictions } from '../data/predictions.js'
import { downloadCSV, toISODate } from '../utils/format.js'
import { useToast } from '../context/ToastContext.jsx'

const PAGE_SIZE = 5
const ICONS = { vibration: Vibrate, thermo: Thermometer, gauge: Gauge, drop: Droplets, bolt: Bolt }
const TREND_COLOR = { critico: '#f40000', alto: '#f59e0b', medio: '#3f4556', bajo: '#0d9488' }

const RISK_OPTIONS = [
  { value: 'todos', label: 'Todos los niveles' },
  ...Object.entries(RISK_LEVELS).map(([value, r]) => ({ value, label: r.label, dot: r.dot })),
]

const fmtUpdated = (date, range) => {
  const time = date.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
  if (range === 'mes') return { main: date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }), sub: time }
  const isToday = date.toDateString() === new Date().toDateString()
  return { main: `${isToday ? 'Hoy' : 'Ayer'}, ${time}`, sub: date.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) }
}

export default function Predicciones() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const initialMachine = MACHINES.some((m) => m.id === params.get('maquina')) ? params.get('maquina') : 'criticas'

  const [machineFilter, setMachineFilter] = useState(initialMachine)
  const [risk, setRisk] = useState('todos')
  const [range, setRange] = useState('7d')
  const [page, setPage] = useState(1)

  // Mantiene la URL sincronizada con el filtro de máquina (sirve para compartir el enlace)
  useEffect(() => {
    if (machineFilter === 'criticas') params.delete('maquina')
    else params.set('maquina', machineFilter)
    setParams(params, { replace: true })
  }, [machineFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPage(1), [machineFilter, risk, range])

  const all = useMemo(() => getPredictions(range), [range])
  const counts = useMemo(() => ({
    total: all.length,
    critico: all.filter((p) => p.risk === 'critico').length,
    altoMedio: all.filter((p) => p.risk === 'alto' || p.risk === 'medio').length,
    bajo: all.filter((p) => p.risk === 'bajo').length,
  }), [all])

  const rows = useMemo(() => {
    const ids = resolveMachineFilter(machineFilter)
    return all
      .filter((p) => ids.includes(p.id) && (risk === 'todos' || p.risk === risk))
      .sort((a, b) => b.probability - a.probability)
  }, [all, machineFilter, risk])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  
  const exportCSV = () => {
    if (!rows.length) return toast('No hay filas para descargar con estos filtros.', 'error')
    downloadCSV(`matriz_predictiva_${range}_${toISODate(new Date())}.csv`, [
      ['Máquina', 'Tipo', 'Nivel de riesgo', 'Probabilidad (%)', 'RUL (h)', 'Variable crítica', 'Tendencia (%)', 'Última actualización'],
      ...rows.map((r) => [r.name, r.type, RISK_LEVELS[r.risk].label, r.probability, r.rul, r.variable, r.trendPct, r.updatedAt.toLocaleString('es-CO')]),
    ])
    toast(`Matriz descargada (${rows.length} máquinas)`)
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Predicciones de falla"
        subtitle="Probabilidad de falla estimada con series de tiempo de vibración, temperatura y corriente."
      >
        <UploadExcelButton />
      </PageHeader>

      <p className="-mt-2 flex items-start gap-2 text-xs text-ink-500 max-w-3xl">
        <Info className="size-4 shrink-0 text-ink-400" />
        Las predicciones son estimaciones estadísticas. Confírmalas con una inspección en planta antes de detener un equipo.
      </p>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de máquinas" value={counts.total} icon={Cpu} caption="100% de la línea monitoreada" />
        <StatCard label="Riesgo crítico" value={counts.critico} icon={AlertTriangle} tone="red" caption="Requieren acción inmediata" />
        <StatCard label="Riesgo alto / medio" value={counts.altoMedio} icon={Gauge} tone="amber" caption="En vigilancia las próximas 48 h" />
        <StatCard label="Riesgo normal / bajo" value={counts.bajo} icon={ShieldCheck} tone="teal" caption="Operación normal" />
      </div>

      <Card className="p-4 grid gap-4 md:grid-cols-3">
        <MachineFilter label="Máquina" value={machineFilter} onChange={setMachineFilter} />
        <Dropdown label="Nivel de riesgo" value={risk} onChange={setRisk} options={RISK_OPTIONS} />
        <Dropdown label="Rango temporal" value={range} onChange={setRange} options={RANGE_OPTIONS} />
      </Card>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 justify-between px-5 py-4 border-b border-neutral-200">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-ink-900">Matriz predictiva de equipos</h2>
            <span className="rounded-full bg-ink-50 text-ink-700 text-xs font-medium px-2.5 py-1">{rows.length} de 17 máquinas</span>
          </div>
          <button
            type="button"
            onClick={exportCSV}
            className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 px-3.5 py-2 text-sm font-medium text-ink-700"
          >
            <Download className="size-4" /> Descargar CSV
          </button>
        </div>

        <div className="overflow-x-auto scroll-thin">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold text-ink-500">
              <tr>
                <th scope="col" className="px-5 py-3">Máquina</th>
                <th scope="col" className="px-5 py-3">Nivel de riesgo</th>
                <th scope="col" className="px-5 py-3">Probabilidad</th>
                <th scope="col" className="px-5 py-3">Tendencia</th>
                <th scope="col" className="px-5 py-3">Última actualización</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {visible.map((r) => {
                const level = RISK_LEVELS[r.risk]
                const Icon = ICONS[r.icon] ?? Bolt
                const upd = fmtUpdated(r.updatedAt, range)
                return (
                  <tr key={r.id} className={r.risk === 'critico' ? 'bg-primary-50/60' : 'hover:bg-neutral-50'}>
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 size-2 rounded-full shrink-0 ${level.dot}`} />
                        <div>
                          <p className="font-semibold text-ink-900">{r.name}</p>
                          <p className="text-xs text-ink-500">{r.type}</p>
                          <p className="mt-1 flex items-center gap-1 text-xs text-ink-600">
                            <Icon className="size-3.5 text-ink-400" /> {r.variable}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${level.badge}`}>
                        {r.risk === 'critico' && <span className="size-1.5 rounded-full bg-white" />}
                        {level.label}
                      </span>
                    </td>
                    <td className="px-5 py-4 w-56">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className={`font-bold ${level.text}`}>{r.probability}%</span>
                        <span className="font-mono text-ink-500">RUL: {r.rul > 300 ? '>' : ''}{r.rul} h</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden" role="progressbar" aria-valuenow={r.probability} aria-valuemin={0} aria-valuemax={100} aria-label={`Probabilidad de falla de ${r.name}`}>
                        <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${r.probability}%` }} />
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <Sparkline data={r.trend} color={TREND_COLOR[r.risk]} />
                        <span className={`text-xs font-semibold tabular-nums ${r.trendPct > 10 ? 'text-primary-600' : r.trendPct > 0 ? 'text-amber-600' : 'text-tertiary-600'}`}>
                          {r.trendPct > 0 ? '+' : ''}{r.trendPct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-ink-800">{upd.main}</p>
                      <p className="text-xs text-ink-500">{upd.sub}</p>
                    </td>
                  </tr>
                )
              })}
              {!visible.length && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <p className="font-semibold text-ink-800">Ninguna máquina coincide con estos filtros</p>
                    <p className="text-sm text-ink-500 mt-1">Prueba con otro nivel de riesgo o elige “Todas las máquinas”.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between px-5 py-3 border-t border-neutral-200 text-xs text-ink-500">
          <span>Mostrando {visible.length} de {rows.length} máquinas</span>
          <nav className="flex items-center gap-1" aria-label="Paginación">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="size-8 grid place-items-center rounded-lg hover:bg-neutral-100 disabled:opacity-40" aria-label="Página anterior">
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                aria-current={n === page ? 'page' : undefined}
                className={`size-8 rounded-lg font-semibold ${n === page ? 'bg-ink-900 text-white' : 'hover:bg-neutral-100 text-ink-700'}`}
              >
                {n}
              </button>
            ))}
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page === pages} className="size-8 grid place-items-center rounded-lg hover:bg-neutral-100 disabled:opacity-40" aria-label="Página siguiente">
              <ChevronRight className="size-4" />
            </button>
          </nav>
        </div>
      </Card>
    </div>
  )
}
