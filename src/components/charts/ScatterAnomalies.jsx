import { CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { C, LegendDot, TooltipBox, axisProps } from './ChartCard.jsx'
import { TEMP_LIMIT } from '../../data/telemetry.js'

export default function ScatterAnomalies({ data }) {
  const ids = [...new Set(data.anomalies.map((a) => a.id))]
  return (
    <ChartCard
      title="Temperatura frente a vibración"
      subtitle="Detección de puntos anómalos multivariables (DBSCAN)"
      legend={<><LegendDot color={C.ink300}>Nominal</LegendDot><LegendDot color={C.red}>Anomalía</LegendDot></>}
      footer={<>
        <span>{data.anomalies.length} registros clasificados como anomalías{ids.length ? ` (${ids.join(', ')})` : ''}</span>
        <span className="font-semibold text-primary-600">Zona crítica &gt; {TEMP_LIMIT} °C</span>
      </>}
    >
      <div className="h-64">
        <ResponsiveContainer>
          <ScatterChart margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
            <CartesianGrid stroke={C.grid} />
            <XAxis type="number" dataKey="temp" name="Temperatura" unit="°C" domain={[35, 100]} {...axisProps} />
            <YAxis type="number" dataKey="vib" name="Vibración" domain={[0, 'auto']} {...axisProps} />
            <ReferenceArea x1={TEMP_LIMIT} x2={100} fill={C.red} fillOpacity={0.06} />
            <ReferenceLine x={TEMP_LIMIT} stroke={C.red} strokeDasharray="4 3"
              label={{ value: 'Límite', position: 'insideBottomRight', fill: C.red, fontSize: 10 }} />
            <Tooltip content={<TooltipBox formatter={(p) => `${p.name}: ${p.value}${p.name === 'Temperatura' ? ' °C' : ' mm/s'}`} />} />
            <Scatter data={data.normalPts} fill={C.ink300} />
            <Scatter data={data.anomalies} fill={C.red} />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
