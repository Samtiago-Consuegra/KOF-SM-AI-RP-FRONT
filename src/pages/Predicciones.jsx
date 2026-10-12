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
import InfoTip from '../components/ui/InfoTip.jsx'
import { criticalMachineOptions } from '../api/machines.js'
import { RISK_COLORS, RISK_LEVELS } from '../data/predictions.js'
import { fmtDateIntl, fmtDateShort, fmtNumber, startOfDay } from '../utils/format.js'
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
  const [machineFilter, setMachineFilter] = useState(() => (requested ? requested : 'criticas'))
  const [risk, setRisk] = useState('todos')
  const [range, setRange] = useState(() => defaultTimeRange(today))
  const [page, setPage] = useState(1)

  const rangeKey = timeRangeKey(range)
  const resolved = useMemo(() => resolveTimeRange(range, today, periods), [range, periods]) // eslint-disable-line react-hooks/exhaustive-deps
  const windowStart = resolved.list[0]
  const windowEnd = resolved.list[resolved.list.length - 1]

  // La matriz se recalcula en el backend cuando el rango termina antes del último dato
  // (un día, semana o mes anteriores): eso hace que TODAS las columnas cambien con el corte.
  const hasta = periods.max && windowEnd && windowEnd < periods.max ? windowEnd : null
  const snapshot = Boolean(hasta)
  const { data, loading, error, refresh } = usePredictions(hasta)
  const dataUntil = data?.meta?.datos_hasta ?? null

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
    if (range.period === 'meses') return
    if (months.length === 0 || months.includes(range.month)) return
    setRange((r) => ({ ...r, period: 'mes', month: months[months.length - 1] }))
  }, [months, range.period, range.month])

  // Mantiene la URL sincronizada con el filtro de máquina
  useEffect(() => {
    if (machineFilter === 'criticas') params.delete('maquina')
    else params.set('maquina', machineFilter)
    setParams(params, { replace: true })
  }, [machineFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => setPage(1), [machineFilter, risk, rangeKey])

  const all = data?.rows ?? []

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

  const machineOptions = useMemo(() => criticalMachineOptions(machines), [machines])

  const machineOption = machineOptions.find((o) => o.value === machineFilter)
  const machineLabel = machineOption ? machineOption.label : machineFilter
  const riskLabel = RISK_OPTIONS.find((o) => o.value === risk)?.label ?? risk
  const periodLabel = resolved.label.charAt(0).toUpperCase() + resolved.label.slice(1)

  const exportXlsx = async () => {
    if (!rows.length) return toast('No hay filas para descargar con estos filtros.', 'error')

    const RISK_EXCEL = {
      critico: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } }, font: { color: { argb: 'FF9C0006' }, bold: true } },
      medio: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } }, font: { color: { argb: 'FF9C5700' }, bold: true } },
      bajo: { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } }, font: { color: { argb: 'FF006100' }, bold: true } },
    }

    try {
      // exceljs es pesado (~1 MB); solo se carga al pulsar "Descargar".
      const { default: ExcelJS } = await import('exceljs')
      const wb = new ExcelJS.Workbook()
      wb.creator = 'KOF SMART'
      const ws = wb.addWorksheet('Matriz predictiva', { views: [{ state: 'frozen', ySplit: 7 }] })

      // Filas 1-6: título y filtros aplicados desde la UI.
      const cell = (addr, value, style) => {
        const c = ws.getCell(addr)
        c.value = value
        if (style) Object.assign(c, style)
        return c
      }

      cell('A1', 'Matriz predictiva de equipos', { font: { bold: true, size: 14, color: { argb: 'FF1F2937' } }, alignment: { vertical: 'middle' } })
      ws.mergeCells('A1:H1')
      ws.getRow(1).height = 26

      cell('A3', 'Generado', { font: { bold: true } })
      cell('B3', generated ? `${fmtDateShort(generated)} ${generated.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}` : '—')
      ws.mergeCells('B3:H3')

      cell('A4', 'Período', { font: { bold: true } })
      const corte = snapshot ? ` · matriz al cierre del ${fmtDateIntl(new Date(`${hasta}T00:00:00`))}` : ' · última ejecución del motor'
      cell('B4', `${periodLabel}${corte}`)
      ws.mergeCells('B4:H4')

      cell('A5', 'Filtros', { font: { bold: true } })
      const datos = dataUntil ? `datos hasta ${fmtDateIntl(new Date(`${dataUntil}T00:00:00`))}` : 'sin datos'
      cell('B5', `Máquina: ${machineLabel} · Nivel de riesgo: ${riskLabel} · ${datos}`)
      ws.mergeCells('B5:H5')

      // Encabezado de la tabla en la fila 7 y datos desde la fila 8.
      const headerRow = ws.getRow(7)
      const HEADERS = ['Máquina', 'Nivel de riesgo', 'IPM', 'Probabilidad / pronóstico', 'Régimen', 'Causa principal', 'Horizonte', 'Tendencia (%)']
      HEADERS.forEach((h, i) => {
        const c = headerRow.getCell(i + 1)
        c.value = h
        c.font = { bold: true, color: { argb: 'FFFFFFFF' } }
        c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } }
        c.alignment = { vertical: 'middle' }
      })
      headerRow.height = 22

      rows.forEach((r, i) => {
        const n = i + 8
        cell(`A${n}`, r.machine)
        const riskCell = cell(`B${n}`, RISK_LEVELS[r.risk].label)
        Object.assign(riskCell, RISK_EXCEL[r.risk] ?? {})
        cell(`C${n}`, r.ipmCurrent != null ? r.ipmCurrent : null)
        cell(`D${n}`, r.probability != null ? r.probability : r.expectedFailuresWeek != null ? `~${fmtNumber(r.expectedFailuresWeek, 1)} fallas/sem` : 'N/A')
        cell(`E${n}`, r.regime ?? '')
        cell(`F${n}`, r.topCause ?? '')
        cell(`G${n}`, r.horizon ?? '')
        cell(`H${n}`, r.trendPctCurrent != null ? r.trendPctCurrent : null)
      })

      // Bordes finos en la región de la tabla.
      const thin = { style: 'thin', color: { argb: 'FFD1D5DB' } }
      for (let r = 7; r <= 7 + rows.length; r++) {
        for (let cIdx = 1; cIdx <= 8; cIdx++) {
          ws.getCell(r, cIdx).border = { top: thin, left: thin, bottom: thin, right: thin }
        }
      }

      // Leyenda del semáforo al pie del reporte.
      const l0 = 7 + rows.length + 2
      cell(`A${l0}`, 'Leyenda · semáforo del IPM (ventana de 12 semanas)', { font: { bold: true } })
      cell(`B${l0}`, 'Bajo', RISK_EXCEL.bajo)
      cell(`D${l0}`, 'Medio', RISK_EXCEL.medio)
      cell(`F${l0}`, 'Crítico', RISK_EXCEL.critico)

      ws.autoFilter = { from: 'A7', to: `H${7 + rows.length}` }
      ;[24, 17, 10, 24, 18, 42, 22, 15].forEach((w, i) => {
        ws.getColumn(i + 1).width = w
      })
      ws.getColumn(1).numFmt = '@'
      ws.getColumn(3).numFmt = '0.0'
      ws.getColumn(8).numFmt = '0.0'

      const fileName = `matriz_predictiva_${new Date().toISOString().slice(0, 10)}.xlsx`
      const buffer = await wb.xlsx.writeBuffer()
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      a.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
      toast(`Matriz Excel descargada (${rows.length} máquinas)`)
    } catch (err) {
      console.error(err)
      toast('No se pudo generar el archivo Excel.', 'error')
    }
  }

  return (
    <div className="space-y-6 max-w-[1500px] mx-auto">
      <PageHeader
        title="Predicciones de falla"
        subtitle="Riesgo y tendencia del IPM de los equipos críticos de la línea, calculados con el motor predictivo."
      >
        <UploadExcelButton
          onFinished={() => {
            setRange(defaultTimeRange(today))
            refresh()
            periods.refresh()
          }}
        />
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
              <span className="text-xs text-ink-500">
                {snapshot
                  ? `Matriz al cierre del ${fmtDateIntl(new Date(`${hasta}T00:00:00`))}`
                  : 'Matriz de la última ejecución del motor'}
              </span>
              {loading && data ? <span className="text-xs text-ink-400 animate-pulse">recalculando…</span> : null}
              <button
                type="button"
                onClick={exportXlsx}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 hover:bg-neutral-50 px-3.5 py-2 text-sm font-medium text-ink-700"
              >
                <Download className="size-4" /> Descargar Excel
              </button>
            </div>
          </div>

          <div className="overflow-x-auto scroll-thin">
            <table className="w-full min-w-[900px] text-sm">
              <thead className="bg-neutral-50 text-left text-xs font-semibold text-ink-500">
                <tr>
                  <th scope="col" className="px-5 py-3">Máquina</th>
                  <th scope="col" className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      Nivel de riesgo
                      <InfoTip title="¿Cómo se mide el nivel de riesgo?">
                        El nivel de riesgo y su semáforo (bajo, medio, crítico) se calculan a partir del IPM,
                        el índice predictivo de mantenimiento, sobre la ventana de las últimas 12 semanas.
                      </InfoTip>
                    </span>
                  </th>
                  <th scope="col" className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      Probabilidad / pronóstico
                      <InfoTip title="¿Qué significa la probabilidad?">
                        Probabilidad de falla estimada según la máquina: próximo turno (Llenadora y Empacadora)
                        o 7 días operativos (Envolvedora). Para la Paletizadora se muestra el pronóstico semanal
                        en fallas por semana.
                      </InfoTip>
                    </span>
                  </th>
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

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3 border-t border-neutral-200 text-xs text-ink-500">
            <span className="font-medium text-ink-700">Semáforo del IPM:</span>
            {Object.entries(RISK_LEVELS).map(([k, level]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className={`size-2 rounded-full ${level.dot}`} />
                {level.label}
              </span>
            ))}
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