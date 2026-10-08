import { addDays, fromISODate, startOfDay, toISODate } from './format.js'

// Modos del filtro de tiempo. "Mes" cubre tanto el mes completo como el rango de días
// que se marque en el calendario (ver resolveTimeRange).
export const PERIOD_OPTIONS = [
  { value: 'hoy', label: 'Hoy' },
  { value: 'semana', label: 'Última semana' },
  { value: 'mes', label: 'Mes' },
]

export const monthKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

// Límite por defecto mientras no respondan los datos reales; el histórico arranca en 2024,
// así que el frontend lo reemplaza con `bounds` de `GET /eda/periodos`.
export const minISODate = (today) => toISODate(addDays(startOfDay(today), -59))
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
 * Convierte el estado del filtro en el rango de días con el que se piden los datos.
 *
 * - `hoy` / `semana` se anclan a hoy.
 * - `mes` con rango de días marcado devuelve exactamente ese rango (uno o varios días).
 * - `mes` sin rango marcado devuelve el mes completo escogido en el dropdown, recortado
 *   a los límites reales de los datos.
 *
 * `bounds` son los límites reales de `GET /eda/periodos` ({min, max}); sin ellos se cae a
 * los últimos 60 días para que la pantalla siga teniendo algo coherente mientras carga.
 */
export function resolveTimeRange(range, today = new Date(), bounds = {}) {
  const day = startOfDay(today)
  const minISO = bounds.min ?? minISODate(day)
  const maxISO = bounds.max ?? maxISODate(day)
  const month = range.month && monthBounds(range.month) ? range.month : monthKey(day)

  let mode = range.period
  let list

  if (mode === 'mes') {
    const from = range.from ? clampISO(range.from, minISO, maxISO) : null
    const to = range.to ? clampISO(range.to, minISO, maxISO) : null
    if (from) {
      // Rango explícito del calendario: un día o varios.
      list = isoList(from, to && to >= from ? to : from)
    } else {
      // Solo mes escogido -> mes completo.
      const { startISO, endISO } = monthBounds(month)
      const mStart = clampISO(startISO, minISO, maxISO)
      const mEnd = clampISO(endISO, minISO, maxISO)
      list = isoList(mStart, mEnd >= mStart ? mEnd : mStart)
    }
  } else if (mode === 'semana') {
    // "Última semana" son los 7 días hasta hoy, no hasta el último dato.
    const todayISO = toISODate(day)
    const start = clampISO(toISODate(addDays(day, -6)), minISO, todayISO)
    list = isoList(start, todayISO)
  } else {
    mode = 'hoy'
    list = [toISODate(day)]
  }

  const start = list[0]
  const end = list[list.length - 1]
  const days = list.length
  const prev = isoList(toISODate(addDays(fromISODate(start), -days)), toISODate(addDays(fromISODate(start), -1)))

  return {
    mode,
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
