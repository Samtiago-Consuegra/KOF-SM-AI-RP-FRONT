import { useMemo } from 'react'
import { CartesianGrid, Legend, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { TooltipBox } from './ChartCard.jsx'
import { CRITICAL_COLOR, fmtInt, gridProps, maxBy, tickStyle } from './edaTheme.jsx'
import { scatterPoints } from './edaData.js'

const fmtPts = (v) => Number(v ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 4 })

// Imagen 8: minutos de paro vs puntos de eficiencia perdidos
export default function MinutosVsEficienciaChart({ stops, className }) {
  const data = useMemo(() => scatterPoints(stops), [stops])
  const worst = maxBy(data, 'efficiency_points_lost')
  return (
    <ChartCard
      className={className}
      title="Minutos de paro vs puntos de eficiencia perdidos"
      subtitle="Cada punto es un paro registrado"
      footer={<>
        <span>{fmtInt(data.length)} paros graficados{worst ? ` · mayor impacto: ${worst.machine}` : ''}</span>
        <span className="font-semibold text-primary-600">Máx. {fmtPts(worst?.efficiency_points_lost ?? 0)} ptos</span>
      </>}
    >
      <ResponsiveContainer>
        <ScatterChart margin={{ top: 8, left: 8, right: 16, bottom: 8 }}>
          <CartesianGrid {...gridProps} />
          <XAxis
            type="number"
            dataKey="stop_minutes"
            name="Minutos de paro"
            tick={tickStyle}
            label={{ value: 'Minutos de paro', position: 'insideBottom', offset: -6, fontSize: 12, fill: '#666' }}
          />
          <YAxis type="number" dataKey="efficiency_points_lost" name="Ptos. Efi. Perd." tick={tickStyle} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3' }}
            content={<TooltipBox formatter={(p) => `${p.name}: ${fmtPts(p.value)}`} />}
          />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
          <Scatter name="Minutos vs puntos de eficiencia" data={data} fill={CRITICAL_COLOR} isAnimationActive={data.length < 800} />
        </ScatterChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
