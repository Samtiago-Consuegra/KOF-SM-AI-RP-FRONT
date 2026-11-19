import { useEffect, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import Card from '../ui/Card.jsx'
import { getCumplimientoSemanal, MAQUINAS_CRITICAS } from '../../services/cumplimientoService.js'
import ChipsTipo from './ChipsTipo.jsx'

const MAQUINA_COLORS = {
  Llenadora: 'var(--color-primary-500)',
  Empacadora: 'var(--color-ink-900)',
  Paletizadora: 'var(--color-tertiary-600)',
  Envolvedora: 'var(--color-primary-300)',
}

const META = 90

// Vista SAP: `sap = { filas, tipos, loading }` llega calculado en el front (cumplimientoSapPorMaquina)
// con las mismas filas que la de paradas; la gráfica no pide datos y se dibuja igual.
export default function CumplimientoChart({ rango, maquina = 'todas', onExpand, bare = false, refreshKey = 0, sap = null }) {
  const [datosParadas, setData] = useState([])
  const [cargandoParadas, setLoading] = useState(true)
  const [porTipo, setPorTipo] = useState({ Preventiva: 0, Correctiva: 0, Predictiva: 0 })

  const desde = rango?.from
  const hasta = rango?.to
  const tipoRango = rango?.type
  const esSap = !!sap

  useEffect(() => {
    if (esSap) return undefined
    let ignore = false
    setLoading(true)
    getCumplimientoSemanal({ rango: desde ? { from: desde, to: hasta, type: tipoRango } : null, maquina })
      .catch(() => [])
      .then((res) => {
        if (!ignore) {
          setData(res)
          setPorTipo(res.porTipo || { Preventiva: 0, Correctiva: 0, Predictiva: 0 })
          setLoading(false)
        }
      })
    return () => { ignore = true }
  }, [esSap, desde, hasta, tipoRango, maquina, refreshKey])

  const data = esSap ? sap.filas || [] : datosParadas
  const loading = esSap ? sap.loading : cargandoParadas
  const maquinasToShow = maquina === 'todas' ? MAQUINAS_CRITICAS : [maquina]
  const esMes = rango?.type === 'month'
  const chartData = []
  const SIN_DETALLE = { ejecutadas: 0, programadas: 0, vencidas: 0, pospuestas: 0, ordenes: 0, noEjecutadas: 0, abiertas: 0 }

  if (rango?.type === 'month') {
    // SAP ya llega ordenado por fecha ('Sem 9' < 'Sem 10'); las filas de paradas se ordenan por etiqueta.
    const unicas = [...new Set(data.map((d) => d.semana))]
    const semanas = esSap ? unicas : unicas.sort()
    semanas.forEach((sem) => {
      const row = { name: sem }
      maquinasToShow.forEach((m) => {
        const found = data.find((d) => d.semana === sem && d.maquina === m)
        row[m] = found ? found.cumplimiento : 0
        row[`${m}_det`] = found || SIN_DETALLE
      })
      chartData.push(row)
    })
  } else {
    maquinasToShow.forEach((m) => {
      const found = data.find((d) => d.maquina === m)
      chartData.push({
        name: m,
        maquina: m,
        cumplimiento: found ? found.cumplimiento : 0,
        cumplimiento_det: found || SIN_DETALLE,
      })
    })
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-ink-900">{label}</p>
        {payload.map((p, i) => {
          const m = p.payload?.maquina || p.dataKey
          const det = p.payload?.[`${p.dataKey}_det`] || {}
          return (
            <div key={i} className="text-xs text-ink-700">
              {esSap ? (
                <>
                  <p>
                    <span style={{ color: MAQUINA_COLORS[m] }}>●</span> {m}:{' '}
                    {det.ordenes ? `${p.value}%` : 'sin órdenes'} ({det.ejecutadas || 0} de {det.ordenes || 0} órdenes)
                  </p>
                  {det.ordenes > 0 && (
                    <p className="pl-3 tabular-nums text-ink-500">
                      {det.ordenes} órdenes · {det.ejecutadas || 0} ejecutadas · {det.noEjecutadas || 0} no ejecutadas · {det.abiertas || 0} abiertas
                    </p>
                  )}
                </>
              ) : (<>
              <p>
                <span style={{ color: MAQUINA_COLORS[m] }}>●</span> {m}:{' '}
                {det.programadas ? `${p.value}%` : 'sin tareas programadas'} ({det.ejecutadas || 0} de {det.programadas || 0} tareas)
              </p>
              {(det.vencidas > 0 || det.pospuestas > 0) && (
                <p className="pl-3 text-ink-500">
                  {det.vencidas || 0} vencidas · {det.pospuestas || 0} pospuestas
                </p>
              )}
              </>)}
            </div>
          )
        })}
      </div>
    )
  }

  const botonAmpliar = onExpand && (
    <button
      type="button"
      onClick={(e) => { e.stopPropagation(); onExpand() }}
      aria-label="Ver en grande"
      title="Ver en grande"
      className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-ink-700 hover:bg-neutral-50"
    >
      <Maximize2 className="size-4" aria-hidden="true" />
    </button>
  )

  const chart = loading ? (
    esSap ? (
      <div className="h-full min-h-[320px] animate-pulse rounded-xl bg-neutral-100" aria-hidden="true" />
    ) : (
    <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-ink-500" aria-live="polite">
      Cargando gráfica…
    </div>
    )
  ) : (
    <ResponsiveContainer width="100%" height={bare ? '100%' : 320}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          payload={maquinasToShow.map((m) => ({ value: m, type: 'square', id: m, color: MAQUINA_COLORS[m] }))}
        />
        <ReferenceLine y={META} stroke="var(--color-ink-400)" strokeDasharray="4 4" label={{ value: `Meta ${META} %`, position: 'right', fill: 'var(--color-ink-500)', fontSize: 12 }} />
        {esMes
          ? maquinasToShow.map((m) => (
            <Bar key={m} dataKey={m} fill={MAQUINA_COLORS[m]} radius={[4, 4, 0, 0]} />
          ))
          : (
            <Bar dataKey="cumplimiento" radius={[4, 4, 0, 0]} maxBarSize={72}>
              {chartData.map((row) => <Cell key={row.maquina} fill={MAQUINA_COLORS[row.maquina]} />)}
            </Bar>
          )}
      </BarChart>
    </ResponsiveContainer>
  )

  if (bare) {
    return <div className="h-full min-h-[360px] w-full">{chart}</div>
  }

  if (esSap) {
    return (
      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold text-ink-900">Cumplimiento de órdenes SAP</h2>
            <p className="text-sm text-ink-500">
              {maquina === 'todas'
                ? `Porcentaje de órdenes ejecutadas ${esMes ? 'por semana y ' : ''}por máquina.`
                : `Vista de ${maquina}. Porcentaje de órdenes ejecutadas${esMes ? ' por semana' : ''}.`}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <ChipsTipo tipos={sap.tipos} label="Órdenes por tipo" />
            {botonAmpliar}
          </div>
        </div>
        <div className="p-4">{chart}</div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Cumplimiento semanal</h2>
          <p className="text-sm text-ink-500">
            {maquina === 'todas'
              ? 'Porcentaje de tareas ejecutadas por semana y por máquina.'
              : `Vista de ${maquina}. Porcentaje de tareas ejecutadas por semana.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
        <ChipsTipo tipos={porTipo} label="Tareas por tipo" />
        {botonAmpliar}
        </div>
      </div>
      <div
        className="cursor-pointer p-4 transition-shadow hover:shadow-sm"
        onClick={() => onExpand && onExpand()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand && onExpand() } }}
      >
        {chart}
      </div>
    </Card>
  )
}
