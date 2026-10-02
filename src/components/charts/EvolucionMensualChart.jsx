import { useMemo } from 'react'
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { TooltipBox } from './ChartCard.jsx'
import { colorByMachine, fmtInt, gridProps, tickStyle } from './edaTheme.jsx'
import { trend } from './edaData.js'

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
// 'YYYY-MM' se muestra tal cual; 'YYYY-MM-DD' (rangos cortos) como '28 sep'
const fmtPeriod = (p) => (p.length > 7 ? `${Number(p.slice(8))} ${MONTHS[Number(p.slice(5, 7)) - 1]}` : p)

// Imagen 5: evolución mensual de paros por equipo
export default function EvolucionMensualChart({ stops, className }) {
  const points = useMemo(() => trend(stops), [stops])
  const machines = [...new Set(points.map((p) => p.machine))].sort((a, b) => a.localeCompare(b, 'es'))
  const periods = [...new Set(points.map((p) => p.month))].sort()
  const daily = periods.some((p) => p.length > 7)
  const colors = colorByMachine(machines)

  const data = periods.map((period) => {
    const row = { period }
    machines.forEach((m) => { row[m] = 0 })
    points.filter((p) => p.month === period).forEach((p) => { row[p.machine] = p.count })
    return row
  })

  const peak = points.reduce((a, b) => (a === null || b.count > a.count ? b : a), null)

  return (
    <ChartCard
      className={className}
      bodyClassName="h-56"
      title={daily ? 'Evolución diaria de paros' : 'Evolución mensual de paros'}
      subtitle={`Paros por ${daily ? 'día' : 'mes'} de cada equipo`}
      footer={<>
        <span>Pico: {peak ? `${peak.machine} en ${fmtPeriod(peak.month)}` : '—'}</span>
        <span className="font-semibold text-primary-600">{fmtInt(peak?.count ?? 0)} paros</span>
      </>}
    >
      <ResponsiveContainer>
        <LineChart data={data} margin={{ top: 8, left: 8, right: 16, bottom: 0 }}>
          <CartesianGrid {...gridProps} />
          <XAxis dataKey="period" tick={tickStyle} tickFormatter={fmtPeriod} minTickGap={16} />
          <YAxis tick={tickStyle} allowDecimals={false} />
          <Tooltip content={<TooltipBox formatter={(p) => `${p.name}: ${fmtInt(p.value)}`} />} labelFormatter={fmtPeriod} />
          <Legend iconSize={machines.length > 6 ? 8 : 14} wrapperStyle={{ fontSize: machines.length > 6 ? 10 : 12 }} />
          {machines.map((m) => (
            <Line key={m} type="monotone" dataKey={m} name={m} stroke={colors[m]} strokeWidth={2} dot={{ r: 2 }} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
