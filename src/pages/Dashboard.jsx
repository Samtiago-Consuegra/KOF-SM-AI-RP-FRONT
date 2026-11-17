import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Activity, AlertTriangle, Clock3, Cpu, FileSpreadsheet, RefreshCw, Timer, ArrowRight, TrendingDown, TrendingUp } from 'lucide-react'
import PageHeader from '../components/ui/PageHeader.jsx'
import UploadExcelButton from '../components/ui/UploadExcelButton.jsx'
import MachineFilter from '../components/ui/MachineFilter.jsx'
import PeriodFilter from '../components/ui/PeriodFilter.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Card from '../components/ui/Card.jsx'
import Skeleton from '../components/ui/Skeleton.jsx'
import ParosPorEquipoChart from '../components/charts/ParosPorEquipoChart.jsx'
import MinutosPorEquipoChart from '../components/charts/MinutosPorEquipoChart.jsx'
import TopFallasChart from '../components/charts/TopFallasChart.jsx'
import DuracionPromedioChart from '../components/charts/DuracionPromedioChart.jsx'
import EvolucionMensualChart from '../components/charts/EvolucionMensualChart.jsx'
import ParosPorTurnoChart from '../components/charts/ParosPorTurnoChart.jsx'
import MinutosVsEficienciaChart from '../components/charts/MinutosVsEficienciaChart.jsx'
import MtbfTable from '../components/charts/MtbfTable.jsx'
import ProximaIntervencionCard from '../components/dashboard/ProximaIntervencionCard.jsx'
import { RISK_LEVELS } from '../data/predictions.js'
import { machineOptions } from '../api/machines.js'
import { trendSeries } from '../api/edaAdapter.js'
import { fetchPredictionPreview } from '../api/predictions.js'
import { useMachines } from '../hooks/useMachines.js'
import { usePeriods } from '../hooks/usePeriods.js'
import { useEdaSummary } from '../hooks/useEdaSummary.js'
import { fmtDateShort, fmtNumber, fromISODate, startOfDay } from '../utils/format.js'
import { defaultTimeRange, resolveTimeRange } from '../utils/period.js'
import { useToast } from '../context/ToastContext.jsx'
import { staggerStyle } from '../utils/motion.js'

/** Plazo de la probabilidad: 7 -> "7 días"; un texto del motor se muestra tal cual. */
const textoHorizonte = (h) => (h == null || h === '' ? null : typeof h === 'number' ? `${h} día${h === 1 ? '' : 's'}` : String(h))

const EMPTY_PREVIEW = { loading: true, available: false, rows: [], message: null, meta: null }

function DashboardSkeleton() {
  return (
    <>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4 kof-fade">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[104px]" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start kof-fade">
        <div className="grid gap-4 md:grid-cols-2">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Skeleton key={i} className="h-[330px]" />)}
        </div>
        <div className="grid gap-4">
          <Skeleton className="h-[300px]" />
          <Skeleton className="h-[260px]" />
        </div>
      </div>
    </>
  )
}

export default function Dashboard() {
  const toast = useToast()
  const today = startOfDay(new Date())
  const [machineFilter, setMachineFilter] = useState('criticas')
  const [range, setRange] = useState(() => defaultTimeRange(today))
  const [lastUpload, setLastUpload] = useState(null)
  const [preview, setPreview] = useState(EMPTY_PREVIEW)

  const { machines, loading: machinesLoading, error: machinesError } = useMachines()
  const periods = usePeriods()
  const resolved = useMemo(() => resolveTimeRange(range, today, periods), [range, periods]) // eslint-disable-line react-hooks/exhaustive-deps

  // El mes en curso suele venir sin paros (el Excel va atrasado), así que caemos al
  // último mes con datos registrados para que la pantalla abra con contenido.
  const { months, loading: periodsLoading } = periods
  const periodsReady = !periodsLoading
  const needsMonthFix = periodsReady && months.length > 0 && !months.includes(range.month)
  // No pedir /eda/summary hasta que periodos cargue y el ajuste de mes se haya aplicado:
  // evita la petición con el rango provisional y otra con el mes corregido.
  const summaryEnabled = periodsReady && !needsMonthFix
  const { ctx, sel, loading, error, refresh } = useEdaSummary(resolved, machineFilter, summaryEnabled)

  useEffect(() => {
    if (months.length === 0 || months.includes(range.month)) return
    setRange((r) => ({ ...r, period: 'mes', month: months[months.length - 1] }))
  }, [months, range.month])

  const loadPreview = useCallback(() => {
    fetchPredictionPreview()
      .then(setPreview)
      .catch((err) => setPreview({ loading: false, available: false, rows: [], message: err.message, meta: null }))
  }, [])

  useEffect(() => { loadPreview() }, [loadPreview])

  const afterUpload = useCallback(() => {
    setLastUpload(null)
    refresh()
    loadPreview()
  }, [refresh, loadPreview])

  const options = useMemo(() => machineOptions(machines), [machines])
  const kpis = sel?.kpis
  const trend = useMemo(() => (sel ? trendSeries(sel) : []), [sel])

  const onRefresh = () => {
    refresh()
    loadPreview()
    toast('Datos actualizados')
  }

  const fileLabel = lastUpload?.name
    ?? (sel?.data_range ? `datos SAP · hasta ${fmtDateShort(fromISODate(sel.data_range.max))}` : 'datos SAP')

  const monitored = machines.length
  const delta = kpis?.delta_vs_previous_pct
  const deltaUp = (delta ?? 0) > 0

  // Vista previa de predicciones: no depende del filtro de máquinas.
  const criticalRows = preview.rows.filter((r) => r.risk === 'critico')
  const topRisk = preview.rows.reduce((a, b) => (a === null || b.probability > a.probability ? b : a), null)

  const horizonte = textoHorizonte(topRisk?.horizon)
  // Fecha de la última ejecución del modelo o, si no viene, el corte de los datos.
  const modeloRaw = preview.meta?.generado ?? preview.meta?.datos_hasta ?? null
  const modeloDate = modeloRaw ? (String(modeloRaw).length <= 10 ? fromISODate(modeloRaw) : new Date(modeloRaw)) : null
  const modeloFecha = modeloDate && !Number.isNaN(modeloDate.getTime()) ? fmtDateShort(modeloDate) : null

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <div className="kof-fade-up">
      <PageHeader title="Dashboard (EDA)">
        <UploadExcelButton onUploaded={setLastUpload} onFinished={afterUpload} />
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          aria-label="Refrescar información"
          title="Refrescar información"
          className="size-10 grid place-items-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-ink-700 disabled:opacity-60"
        >
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </PageHeader>
      </div>

      <p style={staggerStyle(1, 40)} className="kof-fade-up -mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-ink-500">
        <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />Datos de {resolved.label}</span>
        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-ink-600"><FileSpreadsheet className="size-4 text-tertiary-600" />{fileLabel}</span>
      </p>

      {/* Filtros */}
      <Card style={staggerStyle(2, 40)} className="kof-fade-up p-4 flex flex-col lg:flex-row lg:items-end gap-3 lg:gap-4">
        <MachineFilter
          label="Máquinas"
          variant="toolbar"
          value={machineFilter}
          onChange={setMachineFilter}
          options={options}
          className="w-full lg:w-80"
        />
        <div className="lg:ml-auto">
          <PeriodFilter value={range} onChange={setRange} bounds={periods} />
        </div>
      </Card>

      {machinesError && (
        <p className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertTriangle className="size-4 shrink-0" />{machinesError.message}
        </p>
      )}

      {error && (
        <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="flex items-center gap-2 text-sm text-red-700">
            <AlertTriangle className="size-4 shrink-0" />{error.message}
          </p>
          <button onClick={onRefresh} className="rounded-xl bg-ink-900 hover:bg-ink-800 px-3.5 py-2 text-sm font-semibold text-white">
            Reintentar
          </button>
        </Card>
      )}

      {!error && !sel && (loading || !summaryEnabled) && <DashboardSkeleton />}

      {sel?.empty && (
        <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="size-4 shrink-0" />{sel.message ?? 'Sin paros en el periodo seleccionado.'}
        </p>
      )}

      {sel && !sel.empty && (
        <>
          {/* Indicadores — siguen el filtro de máquinas */}
          <div className="grid gap-3 sm:gap-4 grid-cols-2 xl:grid-cols-4">
            <StatCard
              className="kof-fade-up"
              style={staggerStyle(0, 50, 120)}
              countUp
              format={fmtNumber}
              label="Registros de paro"
              value={kpis.events_count}
              icon={AlertTriangle}
              tone="red"
              caption={delta === null ? (
                'Sin periodo anterior con datos para comparar'
              ) : (
                <span className={`inline-flex items-center gap-1 ${deltaUp ? 'text-primary-600' : 'text-tertiary-600'}`}>
                  {deltaUp ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                  {deltaUp ? '+' : ''}{delta}% frente al periodo anterior
                </span>
              )}
            />
            <StatCard
              className="kof-fade-up"
              style={staggerStyle(1, 50, 120)}
              countUp
              format={fmtNumber}
              label="Minutos de paro"
              value={kpis.stop_minutes}
              unit="min"
              icon={Timer}
              caption={`${fmtNumber(kpis.stop_hours, 1)} h de producción detenida`}
            />
            <StatCard
              className="kof-fade-up"
              style={staggerStyle(2, 50, 120)}
              countUp
              label="Equipos analizados"
              value={kpis.machines_count}
              icon={Cpu}
              tone="teal"
              caption={machineFilter === 'criticas' ? 'Máquinas críticas de la línea' : machineFilter === 'todas' ? 'Toda la línea monitoreada' : machineFilter}
            />
            <StatCard
              className="kof-fade-up"
              style={staggerStyle(3, 50, 120)}
              countUp
              decimals={1}
              format={(v) => fmtNumber(v, 1)}
              label="MTBF medio (críticas)"
              value={kpis.mtbf_critical_hours === null ? 'N/A' : kpis.mtbf_critical_hours}
              unit={kpis.mtbf_critical_hours === null ? '' : 'h'}
              icon={Activity}
              tone="amber"
              caption={kpis.mtbf_critical_hours === null
                ? 'La selección no incluye máquinas críticas'
                : `Promedio de ${kpis.critical_machines_count} máquina${kpis.critical_machines_count > 1 ? 's' : ''} crítica${kpis.critical_machines_count > 1 ? 's' : ''}`}
            />
          </div>
        </>
      )}

      {/* Contexto global + vista previa: se muestran aunque la selección esté vacía,
          porque las gráficas de contexto no dependen del filtro de máquinas. */}
      {ctx && !ctx.empty && (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] items-start">
          <div className="grid gap-4 md:grid-cols-2">
            <ParosPorEquipoChart data={ctx.machines} periodLabel={resolved.label} />
            <MinutosPorEquipoChart data={ctx.machines} />
            {sel && !sel.empty && (
              <>
                <TopFallasChart data={sel.top_failures} />
                <DuracionPromedioChart data={sel.avg_duration} />
                <EvolucionMensualChart points={trend} className="md:col-span-2" />
              </>
            )}
            <ParosPorTurnoChart points={ctx.shifts} />
            <MinutosVsEficienciaChart points={ctx.scatter} />
            <MtbfTable rows={ctx.mtbf} className="md:col-span-2" />
          </div>

            <aside className="kof-fade grid gap-4 sm:grid-cols-2 xl:grid-cols-1 xl:sticky xl:top-24">
              {/* Vista previa: predicciones */}
              <Card className="p-5 flex flex-col gap-4">
                <div className="flex items-start gap-2">
                  <Activity className="size-5 shrink-0 mt-0.5 text-primary-500" aria-hidden="true" />
                  <div className="min-w-0">
                    <h2 className="font-bold leading-snug text-ink-900 text-balance">Predicciones de falla</h2>
                    <p className="kof-fade text-xs text-ink-500 whitespace-nowrap">Todas las máquinas monitoreadas</p>
                  </div>
                </div>

                {preview.loading && <Skeleton className="h-[220px]" />}

                {!preview.loading && !preview.available && (
                  <p className="rounded-xl bg-neutral-50 p-4 text-sm text-ink-600">
                    {preview.message ?? 'Aún no hay predicciones calculadas.'}
                  </p>
                )}

                {preview.available && (
                  <>
                    <div className="rounded-xl bg-neutral-50 p-4">
                      <p className="text-xs font-medium text-ink-500">Máquinas en riesgo crítico</p>
                      <p className="mt-1 flex items-baseline gap-2">
                        <span className="text-4xl font-bold text-primary-600 tabular-nums">{criticalRows.length}</span>
                        <span className="text-sm text-ink-600">de {preview.rows.length} monitoreadas</span>
                      </p>
                    </div>
                    {topRisk && (
                      <div className="rounded-xl border border-primary-100 bg-gradient-to-b from-primary-50 to-white p-4">
                        <p className="text-xs font-medium text-ink-500">Mayor riesgo de falla</p>
                        <div className="mt-1 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-lg font-bold text-ink-900">{topRisk.machine}</p>
                            <p className="text-sm text-ink-600">IPM {topRisk.ipm}</p>
                          </div>
                          <div className="text-right">
                            <span className={`text-3xl font-extrabold tabular-nums ${RISK_LEVELS[topRisk.risk]?.text ?? 'text-ink-900'}`}>
                              {topRisk.probability}%
                            </span>
                            {horizonte && (
                              <p className="kof-fade max-w-[9rem] text-[11px] leading-tight text-ink-500">probabilidad en los próximos {horizonte}</p>
                            )}
                          </div>
                        </div>
                        {topRisk.topCause && (
                          <p className="kof-fade mt-3 flex items-start gap-1.5 text-sm text-primary-700">
                            <AlertTriangle className="size-4 mt-0.5 shrink-0" />
                            {topRisk.topCause}
                          </p>
                        )}
                      </div>
                    )}
                    <Link
                      to={`/predicciones?maquina=${encodeURIComponent(topRisk?.machine ?? '')}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-ink-900 hover:bg-ink-800 text-white py-2.5 text-sm font-semibold"
                    >
                      Ver predicción de {topRisk?.machine ?? 'la máquina'} <ArrowRight className="size-4" />
                    </Link>
                    {modeloFecha && (
                      <p className="kof-fade -mt-1 flex items-center justify-center gap-1.5 text-[11px] text-ink-400">
                        <Clock3 className="size-3" aria-hidden="true" />
                        Modelo actualizado: {modeloFecha}
                      </p>
                    )}
                  </>
                )}
              </Card>

              {/* Próxima intervención real del motor (toda la línea) */}
              <ProximaIntervencionCard />
            </aside>
          </div>
      )}
    </div>
  )
}