import { addDays, fromISODate, startOfDay, toISODate } from './format.js'
import { HISTORY_DAYS } from '../data/telemetry.js'

// Modos del filtro de tiempo. El mes usa el rango escogido en el calendario.
export const PERIOD_OPTIONS = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Última semana' },
]

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

// Límite del histórico disponible (mismo origen que los archivos Excel)
export const historyStart = (today) => addDays(startOfDay(today), -(HISTORY_DAYS - 1))

export const minISODate = (today) => toISODate(historyStart(today))
export const maxISODate = (today) => toISODate(startOfDay(today))

// Estado inicial: día actual, sin rango de mes escogido
export const defaultTimeRange = (today = new Date()) => ({
  period: 'hoy',
  month: monthKey(today),
  from: null,
  to: null,
})

// Inicio/fin de un mes 'YYYY-MM'
export function monthBounds(month) {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0)
  return { start, end, startISO: toISODate(start), endISO: toISODate(end), days: end.getDate() }
}

// Solo los meses que tienen archivos disponibles (aprox. los últimos 3 meses)
export const MONTH_OPTIONS = (() => {
  const today = startOfDay(new Date())
  const from = historyStart(today)
  const first = new Date(from.getFullYear(), from.getMonth(), 1)
  const last = new Date(today.getFullYear(), today.getMonth(), 1)
  const options = []
  for (let d = new Date(last); d >= first; d.setMonth(d.getMonth() - 1)) {
    options.push({ value: monthKey(d), label: capitalize(d.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })) })
  }
  return options
})()

const isoList = (fromISO, toISO) => {
  const out = []
  for (let d = fromISODate(fromISO); d <= fromISODate(toISO); d = addDays(d, 1)) out.push(toISODate(d))
  return out
}

const clampISO = (iso, minISO, maxISO) => (iso < minISO ? minISO : iso > maxISO ? maxISO : iso)

const labelFor = (list, mode) => {
  if (mode === 'hoy') return 'hoy'
  if (mode === 'semana') return 'la última semana'
  const a = fromISODate(list[0])
  const b = fromISODate(list[list.length - 1])
  if (list.length === 1) return `del ${a.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
  if (a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear()) {
    return `del ${a.getDate()} al ${b.getDate()} de ${b.toLocaleDateString('es-CO', { month: 'long' })}`
  }
  return `del ${a.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })} al ${b.toLocaleDateString('es-CO', { day: 'numeric', month: 'long' })}`
}

/**
 * Convierte el estado del filtro en el rango de días con el que se calculan
 * los datos. Si está en modo mes sin rango escogido cae al día actual y
 * marca `provisional` para que la pantalla lo advierta.
 */
export function resolveTimeRange(range, today = new Date()) {
  const day = startOfDay(today)
  const minISO = minISODate(day)
  const maxISO = maxISODate(day)
  const month = range.month && monthBounds(range.month) ? range.month : monthKey(day)

  let mode = range.period
  let list

  if (mode === 'mes') {
    const from = range.from ? clampISO(range.from, minISO, maxISO) : null
    const to = range.to ? clampISO(range.to, minISO, maxISO) : null
    if (from && to) list = isoList(from, to <= from ? from : to)
    else { list = [maxISO]; mode = 'hoy' }
  } else if (mode === 'semana') {
    const start = clampISO(toISODate(addDays(day, -6)), minISO, maxISO)
    list = isoList(start, maxISO)
  } else {
    mode = 'hoy'
    list = [maxISO]
  }

  const start = list[0]
  const end = list[list.length - 1]
  const days = list.length
  const prev = isoList(toISODate(addDays(fromISODate(start), -days)), toISODate(addDays(fromISODate(start), -1)))

  return {
    mode,
    provisional: range.period === 'mes' && mode === 'hoy',
    days,
    list,
    prev,
    start,
    end,
    singleDay: days === 1,
    label: labelFor(list, mode),
    seedKey: `${mode}-${start}-${end}`,
  }
}

export const timeRangeKey = (range) => `${range.period}-${range.month}-${range.from ?? ''}-${range.to ?? ''}`
