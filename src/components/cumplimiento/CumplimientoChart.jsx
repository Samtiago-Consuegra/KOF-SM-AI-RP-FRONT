import { useEffect, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import Card from '../ui/Card.jsx'
import { getCumplimientoSemanal, MAQUINAS_CRITICAS } from '../../services/cumplimientoService.js'

const MAQUINA_COLORS = {
  Llenadora: 'var(--color-primary-500)',
  Empacadora: 'var(--color-ink-900)',
  Paletizadora: 'var(--color-tertiary-600)',
  Envolvedora: 'var(--color-primary-300)',
}

const META = 90

const ESTILOS = `
@keyframes kof-chart-in { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
.kof-chart-in { animation: kof-chart-in 320ms cubic-bezier(0.22, 1, 0.36, 1) both; }
@media (prefers-reduced-motion: reduce) {
  .kof-chart-in { animation: kof-chart-fade 160ms ease both; }
}
@keyframes kof-chart-fade { from { opacity: 0; } to { opacity: 1; } }
`

/** Con `data` no consulta el service: dibuja la serie recibida agrupada por `semana` (p. ej. preventivo SAP). */
export default function CumplimientoChart({
  rango,
  maquina = 'todas',
  onExpand,
  bare = false,
  refreshKey = 0,
  data: dataExterna,
  titulo = 'Cumplimiento semanal',
  subtitulo,
  unidad = 'tareas',
}) {
  const [dataPropia, setData] = useState([])
  const [cargando, setLoading] = useState(true)
  const data = dataExterna ?? dataPropia
  const loading = dataExterna ? false : cargando

  useEffect(() => {
    if (dataExterna) return undefined
    let ignore = false
    setLoading(true)
    getCumplimientoSemanal({ rango, maquina }).then((res) => {
      if (!ignore) {
        setData(res)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [rango, maquina, refreshKey, dataExterna])

  const maquinasToShow = maquina === 'todas' ? MAQUINAS_CRITICAS : [maquina]
  const chartData = []

  if (dataExterna || rango?.type === 'month') {
    const semanas = [...new Set(data.map((d) => d.semana))].sort()
    semanas.forEach((sem) => {
      const row = { name: sem }
      maquinasToShow.forEach((m) => {
        const found = data.find((d) => d.semana === sem && d.maquina === m)
        row[m] = found ? found.cumplimiento : 0
        row[`${m}_det`] = found || { ejecutadas: 0, programadas: 0 }
      })
      chartData.push(row)
    })
  } else {
    maquinasToShow.forEach((m) => {
      const found = data.find((d) => d.maquina === m)
      chartData.push({
        name: m,
        [m]: found ? found.cumplimiento : 0,
        [`${m}_det`]: found || { ejecutadas: 0, programadas: 0 },
      })
    })
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
        <p className="mb-2 text-sm font-semibold text-ink-900">{label}</p>
        {payload.map((p, i) => {
          const m = p.dataKey
          const det = payload[0]?.payload?.[`${m}_det`] || {}
          return (
            <p key={i} className="text-xs text-ink-700">
              <span style={{ color: MAQUINA_COLORS[m] }}>●</span> {m}: {p.value}% ({det.ejecutadas || 0} de {det.programadas || 0} {unidad})
            </p>
          )
        })}
      </div>
    )
  }

  const chart = loading ? (
    <div className="flex h-full min-h-[320px] items-center justify-center text-sm text-ink-500" aria-live="polite">
      Cargando gráfica…
    </div>
  ) : (
    <div className="kof-chart-in h-full">
    <style>{ESTILOS}</style>
    <ResponsiveContainer width="100%" height={bare ? '100%' : 320}>
      <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} />
        <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} unit="%" />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <ReferenceLine y={META} stroke="var(--color-ink-400)" strokeDasharray="4 4" label={{ value: `Meta ${META} %`, position: 'right', fill: 'var(--color-ink-500)', fontSize: 12 }} />
        {maquinasToShow.map((m) => (
          <Bar key={m} dataKey={m} fill={MAQUINA_COLORS[m]} radius={[4, 4, 0, 0]} />
        ))}
      </BarChart>
    </ResponsiveContainer>
    </div>
  )

  if (bare) {
    return <div className="h-full min-h-[360px] w-full">{chart}</div>
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">{titulo}</h2>
          <p className="text-sm text-ink-500">
            {subtitulo ?? (maquina === 'todas'
              ? 'Porcentaje de tareas ejecutadas por semana y por máquina.'
              : `Vista de ${maquina}. Porcentaje de tareas ejecutadas por semana.`)}
          </p>
        </div>
        {onExpand && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onExpand() }}
          aria-label="Ver en grande"
          title="Ver en grande"
          className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white text-ink-700 hover:bg-neutral-50"
        >
          <Maximize2 className="size-4" aria-hidden="true" />
        </button>
        )}
      </div>
      <div
        className={onExpand ? 'cursor-pointer p-4 transition-shadow hover:shadow-sm' : 'p-4'}
        onClick={() => onExpand && onExpand()}
        role={onExpand ? 'button' : undefined}
        tabIndex={onExpand ? 0 : undefined}
        onKeyDown={(e) => { if (onExpand && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onExpand() } }}
      >
        {chart}
      </div>
    </Card>
  )
}
