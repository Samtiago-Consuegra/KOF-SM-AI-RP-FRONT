import { useState } from 'react'
import { Maximize2 } from 'lucide-react'
import Card from '../ui/Card.jsx'
import Modal from '../ui/Modal.jsx'

export default function ChartCard({
  title,
  subtitle,
  legend,
  footer,
  children,
  className = '',
  bodyClassName = 'h-64',
  modalBodyClassName = 'h-[70vh]',
}) {
  const [open, setOpen] = useState(false)

  const activate = (e) => {
    if (e.type === 'keydown') {
      if (e.key !== 'Enter' && e.key !== ' ') return
      e.preventDefault()
    }
    setOpen(true)
  }

  return (
    <>
      <Card className={`p-5 flex flex-col ${className}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-base font-bold text-ink-900">{title}</h3>
            {subtitle && <p className="text-xs text-ink-500 mt-0.5">{subtitle}</p>}
          </div>
          {legend && <div className="flex flex-wrap items-center gap-3 text-xs text-ink-600">{legend}</div>}
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={activate}
          onKeyDown={activate}
          aria-label={`Ampliar ${title}`}
          className="group relative mt-4 flex-1 min-h-0 cursor-zoom-in"
        >
          <div className={bodyClassName}>{children}</div>
          <span className="pointer-events-none absolute right-3 top-2 hidden items-center gap-1 rounded-lg bg-ink-900/80 px-2 py-1 text-[11px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
            <Maximize2 className="size-3" /> Ampliar
          </span>
        </div>

        {footer && <div className="mt-3 pt-3 border-t border-neutral-100 text-xs text-ink-600 flex flex-wrap justify-between gap-2">{footer}</div>}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        subtitle={subtitle}
        legend={legend}
        footer={footer}
        bodyClassName={modalBodyClassName}
      >
        {children}
      </Modal>
    </>
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
