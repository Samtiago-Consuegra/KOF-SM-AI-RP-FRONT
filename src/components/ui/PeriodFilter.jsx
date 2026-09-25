import { CalendarDays } from 'lucide-react'

const OPTIONS = [
  { value: 'semana', label: 'Última semana' },
  { value: 'mes', label: 'Último mes' },
]

export default function PeriodFilter({ period, date, onPeriod, onDate, min, max }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <div role="radiogroup" aria-label="Periodo" className="inline-flex rounded-xl bg-neutral-100 p-1">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={period === o.value}
            onClick={() => onPeriod(o.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              period === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <label
        className={`inline-flex items-center gap-2 rounded-xl border px-3 py-1.5 text-sm cursor-pointer transition-colors ${
          period === 'fecha' ? 'border-primary-300 bg-primary-50 text-primary-700' : 'border-neutral-200 bg-white text-ink-700 hover:border-neutral-300'
        }`}
      >
        <CalendarDays className="size-4" />
        <span className="font-medium">Fecha</span>
        <input
          type="date"
          value={date}
          min={min}
          max={max}
          onChange={(e) => { if (e.target.value) { onDate(e.target.value); onPeriod('fecha') } }}
          className="bg-transparent font-mono text-sm outline-none cursor-pointer"
          aria-label="Ver el archivo subido en esta fecha"
        />
      </label>
    </div>
  )
}
