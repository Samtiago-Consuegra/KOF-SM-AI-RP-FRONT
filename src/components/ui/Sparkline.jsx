// `draw` dibuja la línea de izquierda a derecha al montar (pathLength=1 evita medir el path).
export default function Sparkline({ data, color = '#f40000', width = 96, height = 28, draw = false, delay = '0ms' }) {
  const values = data.map((d) => d.v)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => [
    (i / (values.length - 1)) * (width - 4) + 2,
    height - 3 - ((v - min) / span) * (height - 6),
  ])
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const last = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        pathLength={draw ? 1 : undefined}
        className={draw ? 'kof-line-draw' : undefined}
        style={draw ? { animationDelay: delay } : undefined}
      />
      <circle
        cx={last[0]}
        cy={last[1]}
        r="2.5"
        fill={color}
        className={draw ? 'kof-fade' : undefined}
        style={draw ? { animationDelay: `calc(${delay} + 300ms)` } : undefined}
      />
    </svg>
  )
}
