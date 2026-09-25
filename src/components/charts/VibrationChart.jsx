import { Bar, Cell, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { C, TooltipBox, axisProps } from './ChartCard.jsx'
import { VIBRATION_LIMIT } from '../../data/telemetry.js'
import { fmtNumber } from '../../utils/format.js'

export default function VibrationChart({ hist }) {
  const peakCount = Math.max(...hist.bins.map((b) => b.count))
  return (
    <ChartCard
      title="Distribución de vibración RMS"
      subtitle={`Curva normal ajustada y límite de alerta ISO 10816 (${VIBRATION_LIMIT} mm/s)`}
      legend={<span className="rounded-full bg-neutral-100 px-2.5 py-1 font-mono">n = {fmtNumber(hist.n)}</span>}
      footer={<>
        <span className="flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-primary-500" />
          {fmtNumber(hist.overPct, 1)}% de lecturas sobre el umbral
        </span>
        <span className="font-semibold text-primary-600">Asimetría: {hist.skew >= 0 ? '+' : ''}{fmtNumber(hist.skew, 2)}</span>
      </>}
    >
      <div className="h-64">
        <ResponsiveContainer>
          <ComposedChart data={hist.bins} barCategoryGap={2} margin={{ top: 18, right: 4, left: -18, bottom: 0 }}>
            <XAxis dataKey="bin" {...axisProps} interval={1} />
            <YAxis {...axisProps} />
            <Tooltip cursor={{ fill: '#f8f9fa' }} content={<TooltipBox formatter={(p) => p.dataKey === 'count' ? `Lecturas: ${p.value}` : `Curva: ${p.value}`} />} labelFormatter={(l) => `${l} mm/s`} />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {hist.bins.map((b) => (
                <Cell key={b.bin} fill={b.over ? C.red : b.count === peakCount ? C.ink : C.ink200} />
              ))}
            </Bar>
            <Line type="monotone" dataKey="curve" stroke={C.ink} strokeWidth={2} dot={false} />
            <ReferenceLine x={VIBRATION_LIMIT.toFixed(1)} stroke={C.red} strokeDasharray="4 3"
              label={{ value: `Umbral ${VIBRATION_LIMIT} mm/s`, position: 'insideTopRight', fill: C.red, fontSize: 10 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
