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
 *
 * `layout` controla cómo se agrupan los controles:
 * - 'inline' (por defecto): el filtro completo en una sola fila (EDA, Predicciones).
 * - 'spread': cada control con su propio rótulo y sin caja propia (display: contents),
 *   para que Período · Desde · Hasta (o Mes · Días) sean ítems directos del flex
 *   contenedor (Historia clínica: todo en una sola línea).
 *
 * `periodControl` controla cómo se elige el modo del filtro:
 * - 'radio' (por defecto): el segmented control (EDA, Predicciones).
 * - 'dropdown': un Dropdown como los demás filtros (Historia clínica).
 */
export default function PeriodFilter({
  value,
  onChange,
  className = '',
  bounds = {},
  tone = 'white',
  layout = 'inline',
  periodControl = 'radio',
}) {
  const spread = layout === 'spread'
  const months = bounds.months ?? []
  const dropdownVariant = tone === 'neutral' ? 'toolbarNeutral' : 'toolbar'
  const month = value.month ?? months[months.length - 1] ?? null
  // El calendario compara fechas como texto: sin límites deshabilitaría todos los días.
  const min = bounds.min ?? toISODate(monthBounds(month).start)
  const max = bounds.max ?? toISODate(new Date())

  // Rango de meses: "Desde" y "Hasta" (ej.: junio - septiembre).
  const fromMonth = value.fromMonth ?? months[0] ?? null
  const toMonth = value.toMonth ?? months[months.length - 1] ?? null
  const pickMonths = (from, to) => {
    // Si quedan invertidos se reordenan para que "Desde" siempre quede primero.
    const ordered = to && from && to < from ? [to, from] : [from, to]
    onChange({ ...value, period: 'meses', fromMonth: ordered[0], toMonth: ordered[1], from: null, to: null })
  }

  const pickMonth = (key) => onChange({ ...value, period: 'mes', month: key, from: null, to: null })
  // `to` llega en null tras el primer clic: hay que guardarlo así, porque el calendario
  // necesita saber que la selección sigue abierta para esperar el día final. Cerrar
  // el rango aquí (to ?? from) dejaba elegir un solo día pero anulaba los varios días.
  const pickRange = (from, to) => (from ? onChange({ ...value, period: 'mes', from, to }) : onChange({ ...value, from: null, to: null }))

  // Mismo comportamiento que los radios del segmented control.
  const pickPeriod = (p) =>
    p === 'meses'
      ? onChange({ ...value, period: 'meses', fromMonth: months[0] ?? null, toMonth: months[months.length - 1] ?? null })
      : onChange({ ...value, period: p })

  const monthCls = spread ? 'w-full md:w-36 min-w-0' : 'w-44 min-w-0'

  const periodBlock = (
    <div className={spread ? 'w-full md:w-auto' : undefined}>
      <Caption>Período</Caption>
      {periodControl === 'dropdown' ? (
        <Dropdown
          variant={dropdownVariant}
          value={value.period}
          onChange={pickPeriod}
          options={PERIOD_OPTIONS}
          className={spread ? 'w-full md:w-40 min-w-0' : 'w-44 min-w-0'}
          renderValue={(o) => <span className="font-medium">{o?.label}</span>}
        />
      ) : (
        <div role="radiogroup" aria-label="Período" className="inline-flex h-10 items-center rounded-xl bg-neutral-100 p-1">
          {PERIOD_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={value.period === o.value}
              onClick={() => pickPeriod(o.value)}
              className={`h-8 rounded-lg px-3.5 text-sm font-medium whitespace-nowrap transition-colors ${
                value.period === o.value ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-600 hover:text-ink-900'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )

  const monthDropdown = (mValue, onPick) => (
    <Dropdown
      variant={dropdownVariant}
      value={mValue}
      onChange={onPick}
      options={monthOptions(months)}
      className={monthCls}
      renderValue={(o) => <span className="font-medium">{monthShort(o?.value)}</span>}
    />
  )

  const blocks = (
    <>
      {periodBlock}

      {value.period === 'meses' ? (
        spread ? (
          <>
            <div className="w-full md:w-auto">
              <Caption>Desde</Caption>
              {monthDropdown(fromMonth, (key) => pickMonths(key, toMonth))}
            </div>
            <div className="w-full md:w-auto">
              <Caption>Hasta</Caption>
              {monthDropdown(toMonth, (key) => pickMonths(fromMonth, key))}
            </div>
          </>
        ) : (
          <div className="min-w-0">
            <Caption>Rango de meses</Caption>
            <div className="flex items-center gap-2">
              {monthDropdown(fromMonth, (key) => pickMonths(key, toMonth))}
              <span className="shrink-0 text-sm text-ink-400">a</span>
              {monthDropdown(toMonth, (key) => pickMonths(fromMonth, key))}
            </div>
          </div>
        )
      ) : spread ? (
        <>
          <div className="w-full md:w-auto">
            <Caption>Mes</Caption>
            {monthDropdown(month, pickMonth)}
          </div>
          <div className="w-full md:w-auto">
            <Caption>Días</Caption>
            <DateRangePicker
              from={value.from}
              to={value.to}
              month={month}
              onChange={({ from, to }) => pickRange(from, to)}
              onMonthChange={pickMonth}
              min={min}
              max={max}
              tone={tone}
            />
          </div>
        </>
      ) : (
        <div className="min-w-0">
          <Caption>Mes y rango de días</Caption>
          <div className="flex flex-wrap items-center gap-2">
            {monthDropdown(month, pickMonth)}
            <DateRangePicker
              from={value.from}
              to={value.to}
              month={month}
              onChange={({ from, to }) => pickRange(from, to)}
              onMonthChange={pickMonth}
              min={min}
              max={max}
              tone={tone}
            />
          </div>
        </div>
      )}
    </>
  )

  // 'spread': cada bloque con su propia caja pero en una fila independiente, para
  // que Período · Desde · Hasta (o Mes · Días) se muevan juntos y todos los filtros
  // de la página quepan en una sola línea.
  if (spread) {
    return (
      <div className={`flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end md:gap-x-3 ${className}`}>
        {blocks}
      </div>
    )
  }

  return (
    <div className={className}>
      <div className="flex flex-wrap items-end gap-x-4 gap-y-3">{blocks}</div>
    </div>
  )
}
