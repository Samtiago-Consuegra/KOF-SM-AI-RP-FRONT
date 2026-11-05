import { useRef, useState } from 'react'
import { Maximize2 } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts'
import HistoriaChartExpandedModal from './HistoriaChartExpandedModal.jsx'

function ParosTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const row = payload[0]?.payload
  const mant = row?.mantenimientos ?? []
  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-3 shadow-lg">
      <p className="mb-1 text-sm font-semibold text-ink-900">{label}</p>
      <p className="text-xs text-ink-700">Paros: <span className="font-semibold">{row?.paros ?? 0}</span></p>
      <p className="text-xs text-ink-700">Minutos de paro: <span className="font-semibold">{row?.minutosParo ?? 0}</span></p>
      {mant.length > 0 && (
        <div className="mt-2 border-t border-neutral-100 pt-2">
          {mant.map((m, i) => (
            <p key={i} className="text-xs text-ink-600">
              <span className="inline-block size-2 rounded-full bg-tertiary-600 mr-1.5" aria-hidden="true" />
              Preventivo {m.orden} · {m.tarea} · {m.fecha}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * ComposedChart base (misma configuración inline y en el modal).
 * ResponsiveContainer inyecta width/height SOLO en su hijo directo: este
 * componente debe reenviarlos al ComposedChart; sin ellos Recharts no pinta
 * nada (validateWidthHeight devuelve false y el render es null).
 */
function ChartComposed({ data = [], width, height }) {
  return (
    <ComposedChart width={width} height={height} data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
      <CartesianGrid strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="mes" tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} tickLine={false} axisLine={false} />
      <YAxis yAxisId="izq" allowDecimals={false} tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} tickLine={false} axisLine={false} />
      <YAxis yAxisId="der" orientation="right" tick={{ fontSize: 12, fill: 'var(--color-ink-500)' }} tickLine={false} axisLine={false} />
      <Tooltip content={<ParosTooltip />} cursor={{ fill: 'var(--color-neutral-100)' }} />
      <Legend
        payload={[
          { value: 'Paros', type: 'rect', color: 'var(--color-primary-500)' },
          { value: 'Minutos de paro', type: 'line', color: 'var(--color-ink-900)' },
          { value: 'Mantenimiento realizado', type: 'circle', color: 'var(--color-tertiary-600)' },
        ]}
      />
      <Bar yAxisId="izq" dataKey="paros" name="Paros" fill="var(--color-primary-500)" radius={[4, 4, 0, 0]} maxBarSize={28} />
      <Line yAxisId="der" type="monotone" dataKey="minutosParo" name="Minutos de paro" stroke="var(--color-ink-900)" strokeWidth={2} dot={false} />
      {data.map((d) =>
        d.mantenimientos?.length
          ? <ReferenceDot key={d.key} yAxisId="izq" x={d.mes} y={d.paros} r={5} fill="var(--color-tertiary-600)" stroke="var(--color-tertiary-600)" isFront />
          : null,
      )}
    </ComposedChart>
  )
}

function ChartEn({ data, clase }) {
  return (
    <div className={clase}>
      <ResponsiveContainer width="100%" height="100%">
        <ChartComposed data={data} />
      </ResponsiveContainer>
    </div>
  )
}

/**
 * Gráfica "Paros por mes" ampliable: botón Maximize2 en la esquina superior
 * derecha y clic sobre el área de la gráfica abren el modal ampliado.
 */
export default function ParosPorMesChart({ data = [], contexto = '' }) {
  const triggerRef = useRef(null)
  const [open, setOpen] = useState(false)

  return (
    <>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-900">Paros por mes</h3>
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen(true)}
          title="Ver en grande"
          aria-label="Ver en grande"
          className="grid size-8 place-items-center rounded-lg text-ink-500 transition-colors hover:bg-neutral-100 hover:text-ink-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
        >
          <Maximize2 className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div
        role="button"
        tabIndex={0}
        aria-label="Ampliar gráfica de paros por mes"
        onClick={() => setOpen(true)}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setOpen(true) }}
        className="mt-2 h-64 cursor-zoom-in rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary-400"
      >
        <ChartEn data={data} clase="h-full" />
      </div>
      <HistoriaChartExpandedModal
        open={open}
        onClose={() => {
          setOpen(false)
          // Devolver el foco al botón Maximize2 al cerrar
          requestAnimationFrame(() => triggerRef.current?.focus())
        }}
        titulo="Paros por mes"
        contexto={contexto}
      >
        <ChartEn data={data} clase="h-full" />
      </HistoriaChartExpandedModal>
    </>
  )
}
