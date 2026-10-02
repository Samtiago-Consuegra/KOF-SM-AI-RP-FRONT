import { Bar, BarChart, CartesianGrid, Cell, Tooltip, XAxis, YAxis } from 'recharts'
import { TooltipBox } from './ChartCard.jsx'
import { WrapTick, gridProps, tickStyle } from './edaTheme.jsx'

/**
 * Barras horizontales con etiquetas largas (imágenes 4 y 7).
 * Las etiquetas pasan a 2 líneas solo cuando la altura de cada barra lo permite.
 */
export default function HorizontalBars({ width = 0, height = 0, rows, labelKey, dataKey, name, format, colorOf, maxLabel = 260, withMachine = false }) {
  const axisWidth = Math.round(Math.min(maxLabel, Math.max(120, width * 0.38)))
  const rowHeight = (height - 40) / Math.max(1, rows.length)
  const lines = rowHeight >= 30 ? 2 : 1
  const charsPerLine = Math.max(8, Math.floor((axisWidth - 10) / 6.4))

  return (
    <BarChart width={width} height={height} layout="vertical" data={rows} margin={{ top: 4, left: 8, right: 24, bottom: 4 }}>
      <CartesianGrid {...gridProps} />
      <XAxis type="number" tick={tickStyle} />
      <YAxis
        type="category"
        dataKey={labelKey}
        width={axisWidth}
        interval={0}
        tick={<WrapTick charsPerLine={charsPerLine} lines={lines} />}
      />
      <Tooltip
        cursor={{ fill: '#f8f9fa' }}
        content={<TooltipBox formatter={(p) => `${withMachine ? `${p.payload.machine} · ` : ''}${p.name}: ${format(p.value)}`} />}
      />
      <Bar dataKey={dataKey} name={name}>
        {rows.map((r, i) => <Cell key={`${r[labelKey]}-${i}`} fill={colorOf(r)} fillOpacity={0.9} />)}
      </Bar>
    </BarChart>
  )
}
