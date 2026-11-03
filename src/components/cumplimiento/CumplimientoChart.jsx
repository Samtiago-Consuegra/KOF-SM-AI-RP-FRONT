import { useEffect, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Legend } from 'recharts'
import Card from '../ui/Card.jsx'
import Dropdown from '../ui/Dropdown.jsx'
import { getCumplimientoSemanal } from '../../services/cumplimientoService.js'

const MAQUINA_COLORS = {
  'Llenadora': 'var(--color-primary-500)',
  'Empacadora': 'var(--color-ink-900)',
  'Paletizadora': 'var(--color-tertiary-600)',
  'Envolvedora': 'var(--color-primary-300)'
}

const MAQUINA_OPTIONS = [
  { value: 'todas', label: 'Las 4 máquinas críticas' },
  { value: 'Llenadora', label: 'Llenadora' },
  { value: 'Empacadora', label: 'Empacadora' },
  { value: 'Paletizadora', label: 'Paletizadora' },
  { value: 'Envolvedora', label: 'Envolvedora' }
]

const META = 90

export default function CumplimientoChart({ rango, onExpand }) {
  const [maquina, setMaquina] = useState('todas')
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    let ignore = false
    setLoading(true)
    getCumplimientoSemanal({ rango, maquina }).then(res => {
      if (!ignore) {
        setData(res)
        setLoading(false)
      }
    })
    return () => { ignore = true }
  }, [rango, maquina])
  
  // Transformar datos para Recharts
  const chartData = []
  if (rango?.type === 'month') {
    const semanas = [...new Set(data.map(d => d.semana))].sort()
    semanas.forEach(sem => {
      const row = { name: sem }
      const maquinas = maquina === 'todas' ? ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora'] : [maquina]
      maquinas.forEach(m => {
        const found = data.find(d => d.semana === sem && d.maquina === m)
        row[m] = found ? found.cumplimiento : 0
        row[`${m}_det`] = found || { ejecutadas: 0, programadas: 0 }
      })
      chartData.push(row)
    })
  } else {
    const maquinas = maquina === 'todas' ? ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora'] : [maquina]
    maquinas.forEach(m => {
      const found = data.find(d => d.maquina === m)
      chartData.push({
        name: m,
        [m]: found ? found.cumplimiento : 0,
        [`${m}_det`]: found || { ejecutadas: 0, programadas: 0 }
      })
    })
  }
  
  const maquinasToShow = maquina === 'todas' ? ['Llenadora', 'Empacadora', 'Paletizadora', 'Envolvedora'] : [maquina]
  
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
          <p className="mb-2 text-sm font-semibold text-ink-900">{label}</p>
          {payload.map((p, i) => {
            const m = p.dataKey
            const det = payload[0]?.payload?.[`${m}_det`] || {}
            return (
              <p key={i} className="text-xs text-ink-700">
                <span style={{ color: MAQUINA_COLORS[m] }}>●</span> {m}: {p.value}% ({det.ejecutadas || 0} de {det.programadas || 0} tareas)
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }
  
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-200 px-5 py-4">
        <div>
          <h2 className="text-lg font-bold text-ink-900">Cumplimiento semanal</h2>
          <p className="text-sm text-ink-500">Porcentaje de tareas ejecutadas por semana y por máquina.</p>
        </div>
        <div className="flex items-center gap-2">
          <div onClick={(e) => e.stopPropagation()}>
            <Dropdown
              label=""
              value={maquina}
              onChange={setMaquina}
              options={MAQUINA_OPTIONS}
              className="w-56"
            />
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onExpand && onExpand() }}
            aria-label="Ver en grande"
            title="Ver en grande"
            className="grid size-9 place-items-center rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-ink-700"
          >
            <Maximize2 className="size-4" />
          </button>
        </div>
      </div>
      <div 
        className="cursor-pointer p-4 transition-shadow hover:shadow-sm"
        onClick={() => onExpand && onExpand()}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onExpand && onExpand() } }}
      >
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-neutral-200)" />
            <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} unit="%" />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <ReferenceLine y={META} stroke="var(--color-ink-400)" strokeDasharray="4 4" label={{ value: `Meta ${META} %`, position: 'right', fill: 'var(--color-ink-500)', fontSize: 12 }} />
            {maquinasToShow.map(m => (
              <Bar key={m} dataKey={m} fill={MAQUINA_COLORS[m]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
