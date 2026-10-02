import { Bar, BarChart, CartesianGrid, Cell, Legend, Tooltip, XAxis, YAxis } from 'recharts'
import { TooltipBox } from './ChartCard.jsx'
import { AngledTick, CRITICAL_COLOR, OTHER_COLOR, gridProps, tickStyle } from './edaTheme.jsx'

/**
 * Barras verticales por equipo (imágenes 1, 2 y 3).
 * ResponsiveContainer le pasa width/height para ajustar las etiquetas al espacio.
 */
export default function MachineBars({ width = 0, height = 0, data, dataKey, name, format }) {
  const band = Math.max(1, (width - 70) / Math.max(1, data.length))
  // Con espacio se inclina -20° como en la imagen; si las barras son angostas se inclina más
  const steep = band < 50
  const angle = steep ? -60 : -20
  const maxChars = steep ? 12 : Math.max(6, Math.floor((band * 2) / 6.5))
  const longest = Math.min(maxChars, Math.max(0, ...data.map((d) => d.machine.length)))
  const axisHeight = Math.min(80, 22 + longest * (steep ? 5.4 : 2.4))

  return (
    <BarChart width={width} height={height} data={data} margin={{ top: 8, left: 8, right: 8, bottom: 0 }}>
      <CartesianGrid {...gridProps} />
      <XAxis dataKey="machine" interval={0} height={axisHeight} tick={<AngledTick maxChars={maxChars} angle={angle} />} />
      <YAxis tick={tickStyle} allowDecimals={false} />
      <Tooltip cursor={{ fill: '#f8f9fa' }} content={<TooltipBox formatter={(p) => `${p.name}: ${format(p.value)}`} />} />
      <Legend iconType="square" wrapperStyle={{ fontSize: 12 }} />
      <Bar dataKey={dataKey} name={name}>
        {data.map((m) => (
          <Cell key={m.machine} fill={m.critical ? CRITICAL_COLOR : OTHER_COLOR} fillOpacity={0.9} />
        ))}
      </Bar>
    </BarChart>
  )
}
