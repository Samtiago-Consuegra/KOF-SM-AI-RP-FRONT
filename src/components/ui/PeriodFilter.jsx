import Dropdown from './Dropdown.jsx'
import DateRangePicker from './Calendar.jsx'
import { PERIOD_OPTIONS, monthBounds } from '../../utils/period.js'
import { toISODate } from '../../utils/format.js'
import { monthOptions } from '../../api/periods.js'

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
 *
 * El dropdown de mes y el rango de días son controles independientes: elegir un mes
 * carga el mes completo, y marcar días en el calendario acota ese rango a lo escogido.
 * `bounds` son los límites reales de los datos; sin ellos se usa el mes actual.
 */
export default function PeriodFilter({ value, onChange, className = '', bounds = {} }) {
  const months = bounds.months ?? []
  const month = value.month ?? months[months.length - 1] ?? null
  // El calendario compara fechas como texto: sin límites deshabilitaría todos los días.
  const min = bounds.min ?? toISODate(monthBounds(month).start)
  const max = bounds.max ?? toISODate(new Date())

  const pickMonth = (key) => onChange({ ...value, period: 'mes', month: key, from: null, to: null })
  // `to` llega en null tras el primer clic: hay que guardarlo así, porque el calendario
  // necesita saber que la selección sigue abierta para esperar el día final. Cerrar
  // el rango aquí (to ?? from) dejaba elegir un solo día pero anulaba los varios días.
  const pickRange = (from, to) => (from ? onChange({ ...value, period: 'mes', from, to }) : onChange({ ...value, from: null, to: null }))

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
              value={month}
              onChange={pickMonth}
              options={monthOptions(months)}
              className="w-44"
              renderValue={(o) => <span className="font-medium">{monthShort(o?.value)}</span>}
            />
            <DateRangePicker
              from={value.from}
              to={value.to}
              month={month}
              onChange={({ from, to }) => pickRange(from, to)}
              onMonthChange={pickMonth}
              min={min}
              max={max}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
