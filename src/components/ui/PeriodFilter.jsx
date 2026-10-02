import Dropdown from './Dropdown.jsx'
import DateRangePicker from './Calendar.jsx'
import { MONTH_OPTIONS, PERIOD_OPTIONS } from '../../utils/period.js'
import { addDays, startOfDay, toISODate } from '../../utils/format.js'
import { HISTORY_DAYS } from '../../data/telemetry.js'

const Caption = ({ children }) => (
  <span className="block text-xs font-medium text-ink-500 mb-1.5">{children}</span>
)

// "2026-09" -> "Sept. 2026" (en el control cerrado, la lista muestra el mes completo)
const monthShort = (key) => {
  if (!key) return ''
  const [y, m] = key.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * Filtro de tiempo del EDA y de Predicciones.
 * value: { period, month, from, to } — ver utils/period.js
 */
export default function PeriodFilter({ value, onChange, className = '', min, max }) {
  const today = startOfDay(new Date())
  const minISO = min ?? toISODate(addDays(today, -(HISTORY_DAYS - 1)))
  const maxISO = max ?? toISODate(today)

  const pickMonth = (month) => onChange({ ...value, period: 'mes', month, from: null, to: null })
  const pickRange = (from, to) => onChange({ ...value, period: to ? 'mes' : value.period, from, to })

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
        <div>
          <Caption>Período</Caption>
          <div role="radiogroup" aria-label="Período" className="inline-flex h-10 items-center rounded-xl bg-neutral-100 p-1">
            {PERIOD_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={value.period === o.value}
                onClick={() => onChange({ ...value, period: o.value })}
                className={`h-8 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                  value.period === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Caption>Mes y rango de días</Caption>
          <div className="flex items-center gap-2">
            <Dropdown
              variant="toolbar"
              value={value.month}
              onChange={pickMonth}
              options={MONTH_OPTIONS}
              className="w-40"
              renderValue={(o) => <span className="font-medium">{monthShort(o?.value)}</span>}
            />
            <DateRangePicker
              from={value.from}
              to={value.to}
              month={value.month}
              onChange={({ from, to }) => pickRange(from, to)}
              onMonthChange={pickMonth}
              min={minISO}
              max={maxISO}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
