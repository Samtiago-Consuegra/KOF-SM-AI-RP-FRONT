import { TrendingDown, TrendingUp } from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceDot } from 'recharts'

export default function IndicadoresMaquina({ indicadores, parosPorMes, loading }) {
  if (loading || !indicadores) {
    return (
      <div className="rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-100" />
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-50" />)}
        </div>
      </div>
    )
  }
  
  const cards = [
    { key: 'fallas', label: 'FALLAS', value: indicadores.fallas, higherBetter: false },
    { key: 'minutosParo', label: 'MINUTOS DE PARO', value: indicadores.minutosParo, higherBetter: false },
    { key: 'mtbf', label: 'MTBF', value: indicadores.mtbf, unit: 'h', higherBetter: true },
    { key: 'mttr', label: 'MTTR', value: indicadores.mttr, unit: 'min', higherBetter: false },
    { key: 'disponibilidad', label: 'DISPONIBILIDAD', value: indicadores.disponibilidad, unit: '%', higherBetter: true },
    { key: 'cumplimientoPlan', label: 'CUMPLIMIENTO PLAN', value: indicadores.cumplimientoPlan, unit: '%', higherBetter: true }
  ]
  
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white shadow-sm">
      <div className="p-6">
        <h3 className="text-lg font-semibold text-ink-900">Indicadores de la máquina</h3>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => {
            const isBetter = card.higherBetter ? card.value >= indicadores.promedioLinea : card.value <= indicadores.promedioLinea
            const Icon = isBetter ? TrendingUp : TrendingDown
            return (
              <div key={card.key} className="rounded-xl bg-neutral-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">{card.label}</p>
                <p className="mt-1 text-2xl font-bold text-ink-900">{card.value}{card.unit || ''}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-ink-500">Promedio línea: {indicadores.promedioLinea}</span>
                  <Icon className={`size-4 ${isBetter ? 'text-tertiary-600' : 'text-primary-500'}`} />
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-ink-900">Paros por mes</h4>
          <div className="mt-3 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={parosPorMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <Tooltip />
                <Legend />
                <Bar yAxisId="left" dataKey="paros" fill="#F40000" name="Paros" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="minutosParo" stroke="#111827" name="Minutos de paro" strokeWidth={2} />
                {parosPorMes.map((entry, idx) => 
                  entry.mantenimientos?.length > 0 ? (
                    <ReferenceDot key={idx} yAxisId="left" x={entry.mes} y={entry.paros} r={6} fill="#0D9488" stroke="#fff" strokeWidth={2} />
                  ) : null
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-ink-500">
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-500" /> Paros</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-ink-900" /> Minutos de paro</div>
            <div className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-tertiary-600" /> Mantenimiento realizado</div>
          </div>
        </div>
      </div>
    </div>
  )
}
