import Card from '../ui/Card.jsx'

export default function ChartCard({ title, subtitle, legend, footer, children, className = '' }) {
  return (
    <Card className={`p-5 flex flex-col ${className}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-ink-900">{title}</h3>
          {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
        </div>
        {legend && <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">{legend}</div>}
      </div>
      <div className="mt-4 flex-1 min-h-0">{children}</div>
      {footer && <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-ink-600 flex flex-wrap justify-between gap-2">{footer}</div>}
    </Card>
  )
}

export const LegendDot = ({ color, children, square }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`size-2.5 ${square ? 'rounded-sm' : 'rounded-full'}`} style={{ background: color }} />
    {children}
  </span>
)

export const C = {
  red: '#f40000',
  redDark: '#a30000',
  ink: '#262c3b',
  ink300: '#a6adc4',
  ink200: '#c5cbe0',
  grid: '#eff0f2',
  axis: '#8a90a6',
  teal: '#0d9488',
}

export const axisProps = { tick: { fill: C.axis, fontSize: 11 }, axisLine: false, tickLine: false }

export function TooltipBox({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-ink-900 text-white text-xs px-3 py-2 shadow-lg">
      {label !== undefined && <p className="font-semibold mb-1">{label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey ?? p.name} className="flex items-center gap-2">
          <span className="size-2 rounded-full" style={{ background: p.color ?? p.fill }} />
          {formatter ? formatter(p) : `${p.name}: ${p.value}`}
        </p>
      ))}
    </div>
  )
}
