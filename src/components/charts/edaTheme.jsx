import { LegendDot } from './ChartCard.jsx'

// Colores de las gráficas del EDA de paros
export const CRITICAL_COLOR = '#dc2626'
export const OTHER_COLOR = '#780202'
export const OTHER_FAILURE_COLOR = '#f59e0b'
export const PALETTE = [
  '#e11d48', '#f97316', '#f59e0b', '#a3e635', '#10b981',
  '#16a34a', '#ec4899', '#d946ef', '#a855f7', '#ef4444',
  '#facc15', '#84cc16', '#fb923c', '#f43f5e', '#65a30d',
  '#fbbf24', '#9333ea', '#dc2626', '#4ade80', '#eab308',
]

export const gridProps = { strokeDasharray: '3 3' }
export const tickStyle = { fontSize: 12 }

export const fmtInt = (v) => Number(v ?? 0).toLocaleString('es-CO')
export const fmtMin = (v) => `${Number(v ?? 0).toLocaleString('es-CO', { maximumFractionDigits: 1 })} min`

// Color fijo por equipo (orden alfabético) para que coincida entre gráficas
export const colorByMachine = (machines) => {
  const sorted = [...machines].sort((a, b) => a.localeCompare(b, 'es'))
  return Object.fromEntries(sorted.map((m, i) => [m, PALETTE[i % PALETTE.length]]))
}

export const maxBy = (rows, key) =>
  rows.reduce((a, b) => (a === null || b[key] > a[key] ? b : a), null)

const cut = (s, n) => (s.length > n ? `${s.slice(0, Math.max(1, n - 1))}…` : s)

// Etiqueta del eje X inclinada; se recorta según el ancho disponible por barra
export function AngledTick({ x, y, payload, maxChars, angle = -20 }) {
  const text = String(payload?.value ?? '')
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{text}</title>
      <text dy={12} textAnchor="end" transform={`rotate(${angle})`} fill="#666" fontSize={12}>
        {cut(text, maxChars)}
      </text>
    </g>
  )
}

// Etiqueta del eje Y en barras horizontales: hasta 2 líneas si cabe, si no 1 recortada
export function WrapTick({ x, y, payload, charsPerLine, lines }) {
  const text = String(payload?.value ?? '')
  const words = text.split(' ')
  const out = ['']
  for (const w of words) {
    const cur = out[out.length - 1]
    if (!cur) out[out.length - 1] = w
    else if (`${cur} ${w}`.length <= charsPerLine) out[out.length - 1] = `${cur} ${w}`
    else if (out.length < lines) out.push(w)
    else { out[out.length - 1] = `${cur} ${w}`; break }
  }
  const rows = out.map((l) => cut(l, charsPerLine))
  const start = -((rows.length - 1) * 13) / 2
  return (
    <g transform={`translate(${x},${y})`}>
      <title>{text}</title>
      <text x={-6} textAnchor="end" fill="#666" fontSize={12}>
        {rows.map((l, i) => <tspan key={i} x={-6} dy={i === 0 ? start + 4 : 13}>{l}</tspan>)}
      </text>
    </g>
  )
}

// Leyenda de la tarjeta: críticas vs resto de equipos
export function CriticalLegend({ names = [], otherColor = OTHER_COLOR }) {
  return (
    <>
      <LegendDot color={CRITICAL_COLOR} square>Críticas{names.length ? `: ${names.join(', ')}` : ''}</LegendDot>
      <LegendDot color={otherColor} square>Resto de equipos</LegendDot>
    </>
  )
}
