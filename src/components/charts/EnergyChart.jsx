import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { C, LegendDot, TooltipBox, axisProps } from './ChartCard.jsx'

export default function EnergyChart({ data }) {
  const peak = data.reduce((a, b) => (b.kwh > a.kwh ? b : a), data[0])
  const avg = data.reduce((a, b) => a + b.kwh, 0) / data.length
  const over = Math.round(((peak.kwh - avg) / avg) * 100)

  return (
    <ChartCard
      title="Consumo energético y ciclos"
      subtitle="kWh frente a ciclos por minuto de las máquinas seleccionadas"
      legend={<><LegendDot color={C.red} square>Consumo (kWh)</LegendDot><LegendDot color={C.ink} square>Ciclos/min</LegendDot></>}
      footer={<>
        <span>{over > 0 ? `Sobrecarga en ${peak.id} (+${over}% frente al promedio)` : 'Consumo parejo entre máquinas'}</span>
        <span className="font-semibold text-primary-600">Pico: {peak.kwh} kWh</span>
      </>}
    >
      <ResponsiveContainer>
        <BarChart data={data} barGap={4} margin={{ top: 18, right: 4, left: -18, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="id" {...axisProps} interval={data.length > 8 ? 1 : 0} />
          <YAxis {...axisProps} />
          <Tooltip cursor={{ fill: '#f8f9fa' }} content={<TooltipBox />} />
          <Bar dataKey="kwh" name="Consumo (kWh)" fill={C.red} radius={[4, 4, 0, 0]} maxBarSize={28}>
            {data.length <= 6 && <LabelList dataKey="kwh" position="top" fill={C.redDark} fontSize={10} formatter={(v) => `${v} kWh`} />}
          </Bar>
          <Bar dataKey="cycles" name="Ciclos/min" fill={C.ink} radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
