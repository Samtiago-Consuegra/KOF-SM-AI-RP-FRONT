import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertTriangle, ChevronLeft, ChevronRight, Cpu, Download, Gauge, Info, ShieldCheck } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import UploadExcelButton from '../components/ui/UploadExcelButton.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import Dropdown from '../components/ui/Dropdown.jsx'
import MachineFilter from '../components/ui/MachineFilter.jsx'
import PeriodFilter from '../components/ui/PeriodFilter.jsx'
import Sparkline from '../components/ui/Sparkline.jsx'
import { criticalMachineOptions } from '../api/machines.js'
import { RISK_COLORS, RISK_LEVELS } from '../data/predictions.js'
import { downloadCSV, fmtDateIntl, fmtDateShort, fmtNumber, startOfDay } from '../utils/format.js'
import { defaultTimeRange, resolveTimeRange, timeRangeKey } from '../utils/period.js'
import { useMachines } from '../hooks/useMachines.js'
import { usePeriods } from '../hooks/usePeriods.js'
import { usePredictions } from '../hooks/usePredictions.js'
import { useToast } from '../context/ToastContext.jsx'

const PAGE_SIZE = 5

const RISK_OPTIONS = [
  { value: 'todos', label: 'Todos los niveles' },
  ...Object.entries(RISK_LEVELS).map(([value, r]) => ({ value, label: r.label, dot: r.dot })),
]

export default function Predicciones() {
  const toast = useToast()
  const [params, setParams] = useSearchParams()
  const requested = params.get('maquina')
  const today = startOfDay(new Date())

  const { machines } = useMachines()
  const periods = usePeriods()
  const { data, loading, error, refresh } = usePredictions()

  const [machineFilter, setMachineFilter] = useState(() => (requested ? requested : 'criticas'))
  const [risk, setRisk] = useState('todos')
  const [range, setRange] = useState(() => defaultTimeRange(today))
  const [page, setPage] = useState(1)

  const rangeKey = timeRangeKey(range)
  const resolved = useMemo(() => resolveTimeRange(range, today, periods), [range, periods]) // eslint-disable-line react-hooks/exhaustive-deps

  const criticalNames = useMemo(() => machines.filter((m) => m.critical).map((m) => m.machine), [machines])

  // El enlace desde el dashboard pasa el nombre real (p. ej. "Llenadora"); si llega
  // un nombre que no está entre las críticas se cae al grupo completo.
  useEffect(() => {
    if (criticalNames.length && machineFilter !== 'criticas' && !criticalNames.includes(machineFilter)) {
      setMachineFilter('criticas')
    }
  }, [criticalNames, machineFilter])

  // Mismo comportamiento que el dashboard: si el mes actual no tiene datos, abrir
  // en el último mes con registros para que la tendencia muestre algo.
  const { months } = periods
  useEffect(() => {
    if (months.length === 0 || months.includes(range.month)) return
    setRange((r) => ({ ...r, period: 'mes', month: months[months.length - 1] }))
  }, [months, range.month])

  // Mantiene la URL sincronizada con el filtro de máquina
  useEffect(() => {
    if (machineFilter === 'criticas') params.delete('maquina')
    else params.set('maquina', machineFilter)
    setParams(params, { replace: true })
  }, [machineFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPage(1), [machineFilter, risk, rangeKey])

  const all = data?.rows ?? []
  const windowStart = resolved.list[0]
  const windowEnd = resolved.list[resolved.list.length - 1]

  const counts = useMemo(() => ({
    total: all.length,
    critico: all.filter((p) => p.risk === 'critico').length,
    medio: all.filter((p) => p.risk === 'medio').length,
    bajo: all.filter((p) => p.risk === 'bajo').length,
  }), [all])

  // La tendencia del IPM se recorta al rango escogido (mes o días); si el rango no
  // cae sobre ningún punto se muestra la serie completa del modelo.
  const rows = useMemo(() => {
    const byMachine = machineFilter === 'criticas' ? null : [machineFilter]
    const window = windowStart && windowEnd ? { from: windowStart, to: windowEnd } : null
    return all
      .filter((p) => (!byMachine || byMachine.includes(p.machine)) && (risk === 'todos' || p.risk === risk))
      .sort((a, b) => (b.ipm ?? 0) - (a.ipm ?? 0))
      .map((p) => {
        const sliced = window ? p.trend.filter((t) => t.date >= window.from && t.date <= window.to) : p.trend
        const trend = sliced.length >= 2 ? sliced : p.trend
        const last = trend[trend.length - 1]
        const pct = trend.length >= 2 && trend[0].v ? Math.round(((last.v - trend[0].v) / trend[0].v) * 100) : null
        return { ...p, trendDisplay: trend, trendPctCurrent: pct, ipmCurrent: last ? last.v : p.ipm }
      })
  }, [all, machineFilter, risk, windowStart, windowEnd])

  const pages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const visible = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const generated = data?.meta?.generado ? new Date(data.meta.generado) : null
  const dataUntil = data?.meta?.datos_hasta ?? null

  const machineOptions = useMemo(() => criticalMachineOptions(machines), [machines])

  const exportCSV = () => {
    if (!rows.length) return toast('No hay filas para descargar con estos filtros.', 'error')
    downloadCSV(`matriz_predictiva_${toISODate(new Date())}.csv`, [
      ['Máquina', 'Nivel de riesgo', 'IPM', 'Probabilidad de falla (%)', 'Régimen', 'Causa principal', 'Horizonte', 'Tendencia (%)'],
      ...rows.map((r) => [
        r.machine,
        RISK_LEVELS[r.risk].label,
        fmtNumber(r.ipmCurrent, 1),
        r.probability != null ? r.probability : 'N/A',
        r.regime ?? '',
        r.topCause ?? '',
        r.horizon ?? '',
        r.trendPctCurrent != null ? `${r.trendPctCurrent > 0 ? '+' : ''}${r.trendPctCurrent}` : '',
      ]),
    ])
    toast(`Matriz descargada (${rows.length} máquinas)`)
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Predicciones de falla"
        subtitle="Riesgo y tendencia del IPM de los equipos críticos de la línea, calculados con el motor predictivo."
      >
        <UploadExcelButton onFinished={refresh} />
      </PageHeader>

      <p className="-mt-2 flex items-start gap-2 text-xs text-ink-500 max-w-3xl">
        <Info className="size-4 shrink-0 text-ink-400" />
        Las predicciones son estimaciones estadísticas. Confírmalas con una inspección en planta antes de detener un equipo.
      </p>

      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de máquinas" value={counts.total} icon={Cpu} caption="Equipos críticos monitoreados" />
        <StatCard label="Riesgo crítico" value={counts.critico} icon={AlertTriangle} tone="red" caption="Requieren acción inmediata" />
        <StatCard label="Riesgo medio" value={counts.medio} icon={Gauge} tone="amber" caption="En vigilancia" />
        <StatCard label="Riesgo bajo" value={counts.bajo} icon={ShieldCheck} tone="teal" caption="Operación normal" />
      </div>

      <Card className="p-4 flex flex-wrap items-end gap-x-4 gap-y-3">
        <MachineFilter
          label="Máquina"
          variant="toolbar"
          options={machineOptions}
          value={machineFilter}
          onChange={setMachineFilter}
          className="w-full sm:w-64 lg:flex-1 lg:max-w-sm"
        />
        <Dropdown
          label="Nivel de riesgo"
          variant="toolbar"
          value={risk}
          onChange={setRisk}
          options={RISK_OPTIONS}
          className="w-full sm:w-44"
        />
        <PeriodFilter value={range} onChange={setRange} bounds={periods} className="w-full xl:w-auto" />
      </Card>

      {loading && !data && (
        <Card className="p-10 text-center text-sm text-ink-500">
          Cargando la matriz predictiva…
        </Card>
      )}

      {error && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="size-4 shrink-0" />{error.message}
          </p>
          <button onClick={refresh} className="rounded-xl bg-ink-900 hover:bg-ink-800 px-3.5 py-2 text-sm font-semibold text-white">
            Reintentar
          </button>
        </Card>
      )}

      {data?.available === false && (
        <Card className="p-4 text-sm text-ink-600">
          {data.message ?? 'Aún no hay predicciones calculadas. Sube un Excel SAP para generarlas.'}
        </Card>
      )}

      {data?.available && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 justify-between px-5 py-4 border-b border-neutral-200">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-ink-900">Matriz predictiva de equipos</h2>
              <span className="rounded-full bg-ink-50 text-ink-700 text-xs font-medium px-2.5 py-1">{rows.length} de {all.length} máquinas</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-ink-500">Datos de {resolved.label}</span>
              <button
                type="button"
                onClick={exportCSV}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 px-3.5 py-2 text-sm font-medium text-ink-700"
              >
                <Download className="size-4" /> Descargar CSV
              </button>
            </div>
          </div>

          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold text-ink-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Máquina</th>
                  <th scope="col" className="px-5 py-3">Nivel de riesgo</th>
                  <th scope="col" className="px-5 py-3">Probabilidad / pronóstico</th>
                  <th scope="col" className="px-5 py-3">Tendencia</th>
                  <th scope="col" className="px-5 py-3">Últimos datos</th>
                  <th scope="col" className="px-5 py-3">IPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {visible.map((r) => {
                  const level = RISK_LEVELS[r.risk]
                  const positive = (r.trendPctCurrent ?? 0) > 0
                  return (
                    <tr key={r.machine} className={r.risk === 'critico' ? 'bg-primary-50/60' : 'hover:bg-neutral-50'}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <span className={`size-2 rounded-full shrink-0 ${level.dot}`} />
                          <p className="font-semibold text-ink-900">{r.machine}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${level.badge}`}>
                          {r.risk === 'critico' && <span className="size-1.5 rounded-full bg-white" />}
                          {level.label}
                        </span>
                      </td>
                      <td className="px-5 py-4 w-56">
                        {r.probability != null ? (
                          <>
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className={`font-bold ${level.text}`}>{r.probability}%</span>
                            </div>
                            <div className="h-1.5 rounded-full bg-neutral-100 overflow-hidden" role="progressbar" aria-valuenow={r.probability} aria-valuemin={0} aria-valuemax={100} aria-label={`Probabilidad de falla de ${r.machine}`}>
                              <div className={`h-full rounded-full ${level.bar}`} style={{ width: `${r.probability}%` }} />
                            </div>
                          </>
                        ) : r.expectedFailuresWeek != null ? (
                          <div>
                            <p className="text-xs font-semibold text-ink-700">~{fmtNumber(r.expectedFailuresWeek, 1)} fallas/sem</p>
                            <p className="text-[11px] text-ink-500">Pronóstico semanal</p>
                          </div>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <Sparkline data={r.trendDisplay} color={RISK_COLORS[r.risk]} />
                          {r.trendPctCurrent != null ? (
                            <span className={`text-xs font-semibold tabular-nums ${positive ? (r.trendPctCurrent > 15 ? 'text-primary-600' : 'text-amber-600') : 'text-tertiary-600'}`}>
                              {positive ? '+' : ''}{r.trendPctCurrent}%
                            </span>
                          ) : (
                            <span className="text-xs text-ink-400">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p
                          className="font-medium text-ink-800"
                          title={generated ? `Motor ejecutado el ${fmtDateShort(generated)}` : undefined}
                        >
                          {dataUntil ? fmtDateIntl(new Date(`${dataUntil}T00:00:00`)) : '—'}
                        </p>
                        <p className="text-xs text-ink-500">Datos disponibles</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`font-bold tabular-nums ${level.text}`}>{fmtNumber(r.ipmCurrent, 1)}</span>
                        <span className="ms-1.5 text-xs text-ink-400">IPM</span>
                      </td>
                    </tr>
                  )
                })}
                {!visible.length && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center">
                      <p className="font-semibold text-ink-800">Ninguna máquina coincide con estos filtros</p>
                      <p className="text-sm text-ink-500 mt-1">Prueba con otro nivel de riesgo o elige el grupo completo.</p>
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
      )}
    </div>
  )
}