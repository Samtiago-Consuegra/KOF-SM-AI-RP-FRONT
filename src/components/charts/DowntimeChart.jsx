import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartCard, { C, TooltipBox, axisProps } from './ChartCard.jsx'
import { fmtNumber } from '../../utils/format.js'

export default function DowntimeChart({ data, periodLabel, className }) {
  const worst = data.reduce((a, b) => (b.minutes > a.minutes ? b : a), data[0] ?? { minutes: 0 })
  return (
    <ChartCard
      className={className}
      bodyClassName="h-56"
      title="Minutos de paro por día"
      subtitle={`Suma de paros registrados en ${periodLabel}`}
      footer={<>
        <span>Día con más paro: {worst?.label ?? '—'}</span>
        <span className="font-semibold text-primary-600">{fmtNumber(worst?.minutes ?? 0)} min</span>
      </>}
    >
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="downFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={C.red} stopOpacity={0.25} />
              <stop offset="100%" stopColor={C.red} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke={C.grid} />
          <XAxis dataKey="label" {...axisProps} minTickGap={16} />
          <YAxis {...axisProps} />
          <Tooltip content={<TooltipBox formatter={(p) => `${p.value} min en ${p.payload.stops} paros`} />} />
          <Area type="monotone" dataKey="minutes" stroke={C.red} strokeWidth={2} fill="url(#downFill)" dot={data.length <= 7} />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  )
}
