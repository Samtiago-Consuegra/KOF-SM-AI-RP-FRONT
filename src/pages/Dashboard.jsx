import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, CalendarCog, Clock3, Cpu, FileSpreadsheet, RefreshCw, Timer, Wrench, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import UploadExcelButton from '../components/ui/UploadExcelButton.jsx'
import MachineFilter from '../components/ui/MachineFilter.jsx'
import PeriodFilter from '../components/ui/PeriodFilter.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import EnergyChart from '../components/charts/EnergyChart.jsx'
import VibrationChart from '../components/charts/VibrationChart.jsx'
import CorrelationMatrix from '../components/charts/CorrelationMatrix.jsx'
import ScatterAnomalies from '../components/charts/ScatterAnomalies.jsx'
import DowntimeChart from '../components/charts/DowntimeChart.jsx'
import { CRITICAL_IDS, getMachine, resolveMachineFilter } from '../data/machines.js'
import { fileNameFor, getCorrelation, getEnergy, getScatter, getStops, getVibrationHistogram } from '../data/telemetry.js'
import { MAINTENANCE_PLANS, RISK_LEVELS, getPredictions } from '../data/predictions.js'
import { fmtDateShort, fmtNumber, fromISODate, startOfDay } from '../utils/format.js'
import { defaultTimeRange, maxISODate, minISODate, resolveTimeRange } from '../utils/period.js'
import { useToast } from '../context/ToastContext.jsx'

export default function Dashboard() {
  const toast = useToast()
  const today = startOfDay(new Date())
  const [machineFilter, setMachineFilter] = useState('criticas')
  const [range, setRange] = useState(() => defaultTimeRange(today)) // por defecto, día actual
  const [refreshKey, setRefreshKey] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpload, setLastUpload] = useState(null)

  const ids = resolveMachineFilter(machineFilter)
  const stops = useMemo(() => getStops(today), [refreshKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Rango de días que cubre el filtro
  const { days, list, prev, end, singleDay, provisional, label: periodLabel, seedKey: rangeKey, mode } = useMemo(
    () => resolveTimeRange(range, today),
    [range],
  ) // eslint-disable-line react-hooks/exhaustive-deps

  const seedKey = `${rangeKey}-${refreshKey}`

  const stats = useMemo(() => {
    const inRange = stops.filter((s) => ids.includes(s.machineId) && list.includes(s.date))
    const prevCount = stops.filter((s) => ids.includes(s.machineId) && prev.includes(s.date)).length
    const minutes = inRange.reduce((a, s) => a + s.minutes, 0)

    const critSel = ids.filter((id) => CRITICAL_IDS.includes(id))
    const mtbfValues = critSel.map((id) => {
      const n = inRange.filter((s) => s.machineId === id).length
      return (days * 24) / Math.max(1, n)
    })
    const mtbf = mtbfValues.length ? mtbfValues.reduce((a, b) => a + b, 0) / mtbfValues.length : null

    const byDay = list.map((iso) => {
      const day = inRange.filter((s) => s.date === iso)
      return { label: fmtDateShort(fromISODate(iso)).replace(/ de \d{4}|\s\d{4}/, ''), minutes: day.reduce((a, s) => a + s.minutes, 0), stops: day.length }
    })
    const delta = prevCount ? Math.round(((inRange.length - prevCount) / prevCount) * 100) : 0
    return { count: inRange.length, minutes, mtbf, critCount: critSel.length, byDay, delta }
  }, [stops, ids.join(), list, prev, days]) // eslint-disable-line react-hooks/exhaustive-deps

  const charts = useMemo(() => ({
    energy: getEnergy(ids, seedKey),
    hist: getVibrationHistogram(ids, seedKey),
    scatter: getScatter(ids, seedKey),
    corr: getCorrelation(`${machineFilter}-${seedKey}`),
  }), [ids.join(), seedKey]) // eslint-disable-line react-hooks/exhaustive-deps

  const predictions = useMemo(
    () => getPredictions({ mode, seed: rangeKey, days, end }).filter((p) => ids.includes(p.id)),
    [ids.join(), rangeKey, days, mode], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const criticalRisk = predictions.filter((p) => p.risk === 'critico')
  const topRisk = [...predictions].sort((a, b) => b.probability - a.probability)[0]
  const highPlan = MAINTENANCE_PLANS.find((p) => p.priority === 'alta' && ids.includes(p.machineId))

  const refresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshKey((k) => k + 1)
      setRefreshing(false)
      toast('Datos actualizados')
    }, 900)
  }

  const fileName = lastUpload?.name ?? fileNameFor(end)
  const deltaUp = stats.delta > 0

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader title="Dashboard (EDA)">
        <UploadExcelButton onUploaded={setLastUpload} />
        <button
          type="button"
          onClick={refresh}
          disabled={refreshing}
          aria-label="Refrescar información"
          title="Refrescar información"
          className="size-10 grid place-items-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-ink-700 disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </PageHeader>

      <p className="-mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />Datos de {periodLabel}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-600"><FileSpreadsheet className="size-4 text-tertiary-600" />{fileName}</span>
        {provisional && (
          <span className="inline-flex items-center gap-1.5 text-xs text-amber-700">
            <AlertTriangle className="size-4" />Sin rango de días seleccionado: se muestran los datos de hoy de forma provisional
          </span>
        )}
      </p>

      {/* Filtros */}
      <Card className="p-4 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
        <MachineFilter
          label="Máquinas"
          variant="toolbar"
          value={machineFilter}
          onChange={setMachineFilter}
          className="w-full lg:w-80"
        />
        <div className="lg:ml-auto">
          <PeriodFilter
            value={range}
            onChange={setRange}
            min={minISODate(today)}
            max={maxISODate(today)}
          />
        </div>
      </Card>

      {/* Indicadores */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Registros de paro"
          value={fmtNumber(stats.count)}
          icon={AlertTriangle}
          tone="red"
          caption={singleDay ? 'Paros registrados en el archivo del día' : (
            <span className={`inline-flex items-center gap-1 ${deltaUp ? 'text-primary-600' : 'text-tertiary-600'}`}>
              {deltaUp ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
              {deltaUp ? '+' : ''}{stats.delta}% frente al periodo anterior
            </span>
          )}
        />
        <StatCard
          label="Minutos de paro"
          value={fmtNumber(stats.minutes)}
          unit="min"
          icon={Timer}
          caption={`${fmtNumber(stats.minutes / 60, 1)} h de producción detenida`}
        />
        <StatCard
          label="Equipos analizados"
          value={ids.length}
          unit="de 17"
          icon={Cpu}
          tone="teal"
          caption={machineFilter === 'criticas' ? 'Máquinas críticas de la línea' : machineFilter === 'todas' ? 'Toda la línea monitoreada' : getMachine(machineFilter).type}
        />
        <StatCard
          label="MTBF medio (críticas)"
          value={stats.mtbf === null ? 'N/A' : fmtNumber(stats.mtbf, 1)}
          unit={stats.mtbf === null ? '' : 'h'}
          icon={Activity}
          tone="amber"
          caption={stats.mtbf === null ? 'La selección no incluye máquinas críticas' : `Promedio de ${stats.critCount} máquina${stats.critCount > 1 ? 's' : ''} crítica${stats.critCount > 1 ? 's' : ''}`}
        />
      </div>

      {/* Gráficas + columna lateral */}
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
        <div className="grid gap-4 md:grid-cols-2">
          <EnergyChart data={charts.energy} />
          <VibrationChart hist={charts.hist} />
          <CorrelationMatrix matrix={charts.corr} />
          <ScatterAnomalies data={charts.scatter} />
          <DowntimeChart data={stats.byDay} periodLabel={periodLabel} className="md:col-span-2" />
        </div>

        <aside className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:sticky xl:top-24">
          {/* Vista previa: predicciones */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Activity className="size-5 text-primary-500" />
              <h2 className="font-bold text-ink-900">Predicciones de falla</h2>
            </div>
            <div className="rounded-xl bg-neutral-50 p-4">
              <p className="text-xs font-medium text-ink-500">Máquinas en riesgo crítico</p>
              <p className="mt-1 flex items-baseline gap-2">
                <span className="text-4xl font-bold text-primary-600 tabular-nums">{criticalRisk.length}</span>
                <span className="text-sm text-ink-600">de {ids.length} seleccionada{ids.length > 1 ? 's' : ''}</span>
              </p>
            </div>
            {topRisk && (
              <div className="rounded-xl border border-primary-100 bg-gradient-to-b from-primary-50 to-white p-4">
                <p className="text-xs font-medium text-ink-500">Mayor riesgo de falla</p>
                <div className="mt-1 flex items-start justify-between gap-2">
                  <div>
                    <p className="text-lg font-bold text-ink-900">{topRisk.name}</p>
                    <p className="text-sm text-ink-600">{topRisk.type}</p>
                  </div>
                  <span className={`text-3xl font-extrabold tabular-nums ${RISK_LEVELS[topRisk.risk].text}`}>{topRisk.probability}%</span>
                </div>
                <p className="mt-3 flex items-start gap-1.5 text-sm text-primary-700">
                  <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                  {topRisk.variable}
                </p>
              </div>
            )}
            <Link
              to={`/predicciones?maquina=${topRisk?.id ?? ''}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-white py-2.5 text-sm font-semibold"
            >
              Ver predicción de {topRisk?.name ?? 'la máquina'} <ArrowRight className="size-4" />
            </Link>
          </Card>

          {/* Vista previa: mantenimiento */}
          <Card className="p-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <CalendarCog className="size-5 text-tertiary-600" />
              <h2 className="font-bold text-ink-900">Planes de mantenimiento</h2>
            </div>
            {highPlan ? (
              <div className="rounded-xl border border-neutral-200 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-ink-500">Próxima intervención</p>
                  <span className="rounded-md bg-primary-600 text-white text-[11px] font-semibold px-2 py-0.5">Prioridad alta</span>
                </div>
                <p className="mt-1 text-lg font-bold text-ink-900">{getMachine(highPlan.machineId).name}</p>
                <p className="text-sm text-ink-600">{getMachine(highPlan.machineId).type}</p>
                <ul className="mt-3 space-y-1.5 text-sm text-ink-700">
                  <li className="flex items-center gap-2"><Wrench className="size-4 text-primary-500" />{highPlan.task}</li>
                  <li className="flex items-center gap-2"><Clock3 className="size-4 text-ink-400" />{highPlan.when}</li>
                </ul>
              </div>
            ) : (
              <p className="rounded-xl bg-neutral-50 p-4 text-sm text-ink-600">
                No hay mantenimientos de prioridad alta para esta selección. Cambia el filtro de máquinas para ver otras.
              </p>
            )}
            <Link
              to={`/mantenimiento${highPlan ? `?maquina=${highPlan.machineId}` : ''}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-ink-900 py-2.5 text-sm font-semibold"
            >
              Ver plan de mantenimiento <ArrowRight className="size-4" />
            </Link>
          </Card>
        </aside>
      </div>
    </div>
  )
}
