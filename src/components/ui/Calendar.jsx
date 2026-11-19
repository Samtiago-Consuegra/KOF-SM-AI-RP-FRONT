import { useMemo, useRef, useState } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { addDays, fromISODate, toISODate } from '../../utils/format.js'
import { monthBounds, monthKey } from '../../utils/period.js'
import Popover from './Popover.jsx'

const WEEKDAYS = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

const shortDay = (iso) => fromISODate(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })

const rangeText = (from, to) => {
  if (from && to) {
    const a = fromISODate(from)
    const b = fromISODate(to)
    if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
      return `${a.getDate()} – ${b.getDate()} ${b.toLocaleDateString('es-CO', { month: 'short' })}`
    }
    return `${shortDay(from)} – ${shortDay(to)}`
  }
  if (from) return `${shortDay(from)} → …`
  return '———'
}

/** Hoy en fecha local (no UTC: en Colombia después de las 19:00 UTC ya sería "mañana"). */
export const hoyLocalISO = () => toISODate(new Date())

/** Hora local actual 'HH:MM' (comparable como texto con un <input type="time">). */
export const horaActual = () => new Date().toTimeString().slice(0, 5)

/** ¿El día es anterior a la fecha mínima? Sin mínimo, nunca. */
export const esAntesDe = (iso, minDate) => !!minDate && !!iso && iso < minDate

const MIN_ABS = '0000-01-01'
const MAX_ABS = '9999-12-31'

/**
 * Días de un mes. Modo rango (clic en el día inicial y luego en el final) o `single` (un día).
 * Los días fuera de [min, max] o anteriores a `minDate` quedan atenuados y con aria-disabled.
 */
export function MonthCalendar({ from, to, month, onChange, onMonthChange, min = MIN_ABS, max = MAX_ABS, minDate = null, single = false, gridRef }) {
  const [hover, setHover] = useState(null)
  const todayISO = toISODate(new Date())
  if (minDate && minDate > min) min = minDate

  const { cells, prevMonth, nextMonth } = useMemo(() => {
    const b = monthBounds(month)
    const lead = (b.start.getDay() + 6) % 7 // semanas desde el lunes
    const list = [
      ...Array.from({ length: lead }, () => null),
      ...Array.from({ length: b.days }, (_, i) => toISODate(new Date(b.start.getFullYear(), b.start.getMonth(), i + 1))),
    ]
    while (list.length % 7) list.push(null)
    const shift = (delta) => {
      const d = new Date(b.start.getFullYear(), b.start.getMonth() + delta, 1)
      return monthKey(d)
    }
    return { cells: list, prevMonth: shift(-1), nextMonth: shift(1) }
  }, [month])

  const canPrev = monthBounds(prevMonth).endISO >= min
  const canNext = monthBounds(nextMonth).startISO <= max

  const endEdge = to ?? from
  const previewEnd = !to && from && hover && hover > from ? hover : null

  const inRange = (iso) => (from && to ? iso >= from && iso <= to : !!(previewEnd && from && iso >= from && iso <= previewEnd))
  const isEdge = (iso) => iso === from || iso === endEdge
  const selectable = (iso) => iso >= min && iso <= max

  const pick = (iso) => {
    if (!selectable(iso)) return
    if (single) return onChange({ from: iso, to: iso })
    if (!to) {
      if (!from) return onChange({ from: iso, to: null })
      return onChange(iso < from ? { from: iso, to: from } : { from, to: iso })
    }
    onChange({ from: iso, to: iso })
  }

  const focusDay = (iso) => gridRef?.current?.querySelector(`[data-iso="${iso}"]`)?.focus()

  const shiftMonth = (delta, iso) => {
    const [y, m] = month.split('-').map(Number)
    const d = new Date(y, m - 1 + delta, 1)
    const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate()
    onMonthChange(monthKey(d))
    const day = Math.min(fromISODate(iso).getDate(), last)
    setTimeout(() => focusDay(toISODate(new Date(d.getFullYear(), d.getMonth(), day))), 0)
  }

  const onKeyDown = (e, iso) => {
    const step = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[e.key]
    if (step) {
      e.preventDefault()
      return focusDay(toISODate(addDays(fromISODate(iso), step)))
    }
    if (e.key === 'PageUp') { e.preventDefault(); shiftMonth(-1, iso) }
    if (e.key === 'PageDown') { e.preventDefault(); shiftMonth(1, iso) }
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-2 pb-2">
        <button
          type="button"
          onClick={() => onMonthChange(prevMonth)}
          disabled={!canPrev}
          aria-label="Mes anterior"
          className="size-8 grid place-items-center rounded-lg text-ink-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronLeft className="size-4" />
        </button>
        <p className="text-sm font-semibold text-ink-900 capitalize">{monthBounds(month).start.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</p>
        <button
          type="button"
          onClick={() => onMonthChange(nextMonth)}
          disabled={!canNext}
          aria-label="Mes siguiente"
          className="size-8 grid place-items-center rounded-lg text-ink-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div role="grid" aria-label="Calendario" className="grid grid-cols-7 gap-0.5">
        {WEEKDAYS.map((w) => (
          <div key={w} role="columnheader" className="h-8 grid place-items-center text-[11px] font-semibold text-ink-400">{w}</div>
        ))}
        {cells.map((iso, i) => {
          if (!iso) return <div key={`e${i}`} className="h-9" />
          const enabled = selectable(iso)
          const edge = isEdge(iso)
          return (
            <button
              key={iso}
              type="button"
              data-iso={iso}
              aria-disabled={!enabled || undefined}
              role="gridcell"
              aria-selected={!!from && inRange(iso)}
              aria-label={fromISODate(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })}
              onClick={() => pick(iso)}
              onMouseEnter={() => enabled && setHover(iso)}
              onMouseLeave={() => setHover(null)}
              onKeyDown={(e) => onKeyDown(e, iso)}
              className={[
                'h-9 rounded-lg text-sm grid place-items-center transition-[background-color,color,opacity] duration-200',
                !enabled && 'text-ink-300 opacity-50 cursor-not-allowed',
                enabled && !edge && !inRange(iso) && 'text-ink-700 hover:bg-neutral-100',
                enabled && inRange(iso) && !edge && 'bg-primary-50 text-primary-700',
                edge && 'bg-primary-500 text-white font-bold hover:bg-primary-600',
                iso === todayISO && !edge && 'ring-1 ring-inset ring-ink-900/20',
              ].filter(Boolean).join(' ')}
            >
              {fromISODate(iso).getDate()}
            </button>
          )
        })}
      </div>

      {!single && (
      <div className="mt-2 flex items-center justify-between gap-2 border-t border-neutral-100 pt-2">
        <p className="text-xs text-ink-500">{from ? (to ? rangeText(from, to) : `${shortDay(from)} → marca el día final`) : 'Marca el día inicial y el final'}</p>
        {from && (
          <button type="button" onClick={() => onChange({ from: null, to: null })} className="text-xs font-semibold text-primary-600 hover:text-primary-700">
            Limpiar
          </button>
        )}
      </div>
      )}
    </div>
  )
}

const largoDia = (iso) => fromISODate(iso).toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })

/** Selector de un solo día (mismo popover y grid que el de rango). `minDate` bloquea días anteriores. */
export function DatePicker({ id, value, onChange, minDate = null, label = 'Seleccionar fecha', className = '' }) {
  const [open, setOpen] = useState(false)
  const [month, setMonth] = useState(() => monthKey(fromISODate(value || minDate || toISODate(new Date()))))
  const gridRef = useRef(null)
  return (
    <Popover
      open={open}
      onOpenChange={(v) => { setOpen(v); if (v && value) setMonth(monthKey(fromISODate(value))) }}
      role="dialog"
      label={label}
      maxHeight={null}
      className="w-[21rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl"
      trigger={(props) => (
        <button type="button" id={id} {...props} className={`inline-flex w-full items-center gap-2 text-left ${className}`}>
          <CalendarDays className="size-4 shrink-0 text-ink-400" aria-hidden="true" />
          <span className={value ? 'text-ink-900' : 'text-ink-400'}>{value ? largoDia(value) : 'Elegir día'}</span>
        </button>
      )}
    >
      <div ref={gridRef}>
        <MonthCalendar
          single
          from={value || null}
          to={value || null}
          month={month}
          minDate={minDate}
          onMonthChange={setMonth}
          onChange={({ from }) => { onChange?.(from); setOpen(false) }}
          gridRef={gridRef}
        />
      </div>
    </Popover>
  )
}

/** Control de fecha que abre el popover de selección de rango. */
export default function DateRangePicker({ from, to, month, onChange, onMonthChange, min, max, minDate = null, label = 'Fecha', tone = 'white' }) {
  const [open, setOpen] = useState(false)
  const gridRef = useRef(null)

  const text = rangeText(from, to)
  // Un solo día marcado (to aún en null) también cuenta como selección activa: de lo
  // contrario el botón ni se resalta ni ofrece la "X" para limpiarlo.
  const active = Boolean(from)

  return (
    <div className="relative flex items-center">
      {/* Popover mantiene el calendario dentro de la ventana (flip/shift) y por encima de todo. */}
      <Popover
        open={open}
        onOpenChange={setOpen}
        role="dialog"
        label="Seleccionar rango de días"
        maxHeight={null}
        className="w-[21rem] max-w-[calc(100vw-1.5rem)] rounded-2xl border border-neutral-200 bg-white p-3 shadow-xl"
        trigger={(props) => (
          <button
            type="button"
            {...props}
            className={`inline-flex h-10 items-center gap-2 rounded-xl border text-sm transition-colors ${
              active
                ? 'border-primary-300 bg-primary-50 pl-3.5 pr-9 text-primary-700'
                : tone === 'neutral'
                  ? 'border-neutral-200 bg-neutral-50 px-3.5 text-ink-700 hover:bg-neutral-100'
                  : 'border-neutral-200 bg-white px-3.5 text-ink-700 hover:border-neutral-300'
            }`}
          >
            <CalendarDays className="size-4 shrink-0" />
            <span className="text-ink-500">{label}</span>
            <span className="font-medium font-mono whitespace-nowrap">{text}</span>
          </button>
        )}
      >
        <div ref={gridRef}>
          <MonthCalendar
            from={from}
            to={to}
            month={month}
            onChange={onChange}
            onMonthChange={onMonthChange}
            min={min}
            max={max}
            minDate={minDate}
            gridRef={gridRef}
          />
        </div>
      </Popover>

      {active && (
        <button
          type="button"
          aria-label="Limpiar rango de días"
          title="Limpiar rango de días"
          onClick={() => onChange({ from: null, to: null })}
          className="absolute right-1 grid size-7 place-items-center rounded-lg text-primary-500 hover:bg-primary-100 hover:text-primary-700"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
