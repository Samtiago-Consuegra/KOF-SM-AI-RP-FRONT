import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { TooltipBox } from './ChartCard.jsx'
import { colorByMachine, fmtInt, gridProps, tickStyle } from './edaTheme.jsx'

// Distribución de paros por turno. Contexto global: ignora el filtro de máquinas.
export default function ParosPorTurnoChart({ points, className }) {
  const machines = [...new Set(points.map((p) => p.machine))].sort((a, b) => a.localeCompare(b, 'es'))
  const shifts = [...new Set(points.map((p) => p.shift))].sort()
  const colors = colorByMachine(machines)

  const data = shifts.map((shift) => {
    const row = { shift: `Turno ${shift}`, total: 0 }
    machines.forEach((m) => {
      const hit = points.find((p) => p.shift === shift && p.machine === m)
      row[m] = hit?.count ?? 0
      row.total += row[m]
    })
    return row
  })
  const top = data.reduce((a, b) => (a === null || b.total > a.total ? b : a), null)

  return (
    <ChartCard
      className={className}
      title="Distribución de paros por turno"
      subtitle="Paros de cada equipo en cada turno"
      footer={<>
        <span>Turno con más paros: {top?.shift ?? '—'}</span>
        <span className="font-semibold text-primary-600">{fmtInt(top?.total ?? 0)} paros</span>
      </>}
    >
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 8, left: 8, right: 16, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="shift" tick={tickStyle} />
          <YAxis tick={tickStyle} allowDecimals={false} />
          <Tooltip cursor={{ fill: '#f8f9fa' }} content={<TooltipBox formatter={(p) => `${p.name}: ${fmtInt(p.value)}`} />} />
          <Legend iconType="square" iconSize={machines.length > 6 ? 8 : 14} wrapperStyle={{ fontSize: machines.length > 6 ? 10 : 12 }} />
          {machines.map((m) => (
            <Bar key={m} dataKey={m} name={m} fill={colors[m]} fillOpacity={0.9} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
